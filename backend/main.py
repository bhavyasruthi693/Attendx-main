from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import time
import logging
import os
from rate_limiter import rate_limit_middleware, metrics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

from database import SessionLocal, engine
from models import Student, Attendance
from student_schemas import (
    LoginRequest, 
    StudentResponse, 
    AttendanceRequest,
    AttendanceResponse,
    StudentAttendanceData
)

from database import Base

# Initialize database with retry logic
def initialize_database_with_retries(max_retries=5, initial_delay=2):
    """Initialize database tables with exponential backoff retry logic"""
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            print(f"[Database] Attempt {attempt + 1}/{max_retries} to create database tables...")
            Base.metadata.create_all(bind=engine)
            print("[Database] Successfully created database tables")
            return True
        except Exception as e:
            print(f"[Database] Connection failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                print(f"[Database] Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 2  # exponential backoff
            else:
                print("[Database] All retry attempts exhausted. App will start with limited functionality.")
                print("[Database] Some endpoints may fail until the database becomes available.")
                return False
    return False

# Attempt database initialization with retries
initialize_database_with_retries()

# Seed students from CSV on first run if DB empty
import os
import csv
from sqlalchemy.orm import Session

def seed_students_if_empty(db: Session):
    from models import Student
    count = db.query(Student).count()
    if count > 0:
        return

    csv_path = os.path.join(os.path.dirname(__file__), "attendx.csv")
    if not os.path.exists(csv_path):
        print("DEBUG: attendx.csv not found, skipping seeding")
        return

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            student = Student(
                student_id=row.get("student_id") or "",
                password=row.get("password") or "",
                name=row.get("name") or "",
                roll_no=row.get("roll_no") or "",
                class_name=row.get("class_name") or "",
                semester=row.get("semester") or "",
                present=int(row.get("present") or 0),
                absent=int(row.get("absent") or 0),
            )
            db.add(student)
        db.commit()
    print("DEBUG: Seeded students from attendx.csv")

# (Seeding will be invoked after DB helpers are defined)

from datetime import datetime, date

def parse_date(value: str) -> date:
    """Parse incoming date strings into a datetime.date.

    Tries common formats including ISO `YYYY-MM-DD` and short formats like `Jan 22`.
    For formats without a year (e.g. `Jan 22`) the current year is applied.
    Raises ValueError if parsing fails.
    """
    if isinstance(value, date):
        return value

    value = value.strip()
    fmts = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%b %d %Y",
        "%b %d",
        "%d %b %Y",
        "%d %b",
    ]
    for fmt in fmts:
        try:
            dt = datetime.strptime(value, fmt)
            if fmt in ("%b %d", "%d %b"):
                # apply current year when year is missing
                dt = dt.replace(year=datetime.now().year)
            return dt.date()
        except Exception:
            continue
    # final attempt: try parsing ISO-like with spaces
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        raise ValueError(f"Unrecognized date format: {value}")


app = FastAPI(title="AttendX API", description="High-performance attendance tracking system")

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Restrict in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

@app.on_event("startup")
def warm_database_connection():
    """Warm up the DB connection on startup to reduce first-request latency."""
    logger.info("Starting database warm-up...")
    for attempt in range(3):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection warm-up successful")
            return
        except Exception as e:
            logger.error(f"Database warm-up failed (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(2)
    logger.warning("Database warm-up failed after 3 attempts - app starting in degraded mode")

@app.get("/health")
def healthcheck():
    """Lightweight healthcheck with DB connectivity and system metrics."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        # Get system metrics
        login_stats = metrics.get_stats("/login")
        
        return {
            "status": "ok",
            "db": "up",
            "timestamp": time.time(),
            "metrics": {
                "login_avg_latency_ms": login_stats.get("avg_latency_ms", 0),
                "login_errors": login_stats.get("error_count", 0)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "db": "down",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/metrics")
def get_metrics():
    """Get request metrics for monitoring (admin only in production)."""
    endpoints = ["/login", "/students", "/attendance/{student_id}"]
    return {
        "timestamp": time.time(),
        "metrics": {endpoint: metrics.get_stats(endpoint) for endpoint in endpoints}
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Run seeding safely now that SessionLocal/get_db are available
try:
    db = SessionLocal()
    seed_students_if_empty(db)
except Exception as e:
    print(f"[Seeding] Warning: Could not seed students: {str(e)}")
finally:
    try:
        db.close()
    except Exception:
        pass

@app.get("/")
def root():
    return {"message": "Backend running"}

@app.post("/login", response_model=StudentResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Student login with rate limiting and error handling."""
    try:
        # Query with connection pooling
        student = db.query(Student).filter(
            Student.student_id == data.student_id
        ).first()

        if not student:
            logger.warning(f"Login failed: student not found - {data.student_id}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if student.password != data.password:
            logger.warning(f"Login failed: invalid password - {data.student_id}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        logger.info(f"Login successful: {student.student_id}")
        return {
            "studentId": student.student_id,
            "name": student.name,
            "rollNo": str(student.roll_no),
            "className": student.class_name,
            "semester": student.semester,
            "present": student.present,
            "absent": student.absent
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/student/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Get student details by student ID"""
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "studentId": student.student_id,
        "name": student.name,
        "rollNo": student.roll_no,
        "className": student.class_name,
        "semester": student.semester,
        "present": student.present,
        "absent": student.absent
    }

@app.get("/students")
def get_all_students(db: Session = Depends(get_db)):
    """Get all students from database"""
    students = db.query(Student).all()
    
    return [
        {
            "studentId": student.student_id,
            "name": student.name,
            "rollNo": student.roll_no,
            "className": student.class_name,
            "semester": student.semester,
            "present": student.present,
            "absent": student.absent
        }
        for student in students
    ]


@app.post("/attendance/update", response_model=AttendanceResponse)
def update_attendance(data: AttendanceRequest, db: Session = Depends(get_db)):
    """Update attendance for a student - Used by Admin Panel"""
    

    student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    

    # ensure date is a proper date object before querying DB
    try:
        parsed_date = parse_date(data.date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    attendance = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.date == parsed_date,
        Attendance.subject == data.subject
    ).first()
    
    if not attendance:
        attendance = Attendance(
            student_id=data.student_id,
            date=parsed_date,
            subject=data.subject,
            status=data.status
        )
        db.add(attendance)
    else:
        attendance.status = data.status
    
    db.commit()
    db.refresh(attendance)
    
    return AttendanceResponse(
        id=attendance.id,
        student_id=attendance.student_id,
        date=attendance.date,
        subject=attendance.subject,
        status=attendance.status,
        updated_at=attendance.updated_at
    )

@app.get("/attendance/{student_id}")
def get_student_attendance(student_id: str, db: Session = Depends(get_db)):
    """Get all attendance records for a student - Used by Student Dashboard"""
    

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # fetch all attendance records for the student
    records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()
    

    attendance_data = {}
    for record in records:
        if record.date not in attendance_data:
            attendance_data[record.date] = {}
        attendance_data[record.date][record.subject] = record.status
    
    return {
        "rollNo": student.roll_no,
        "attendance": attendance_data
    }

@app.get("/attendance/{student_id}/{date}")
def get_date_attendance(student_id: str, date: str, db: Session = Depends(get_db)):
    """Get attendance for a specific date"""
    # parse requested date
    try:
        parsed_date = parse_date(date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    records = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.date == parsed_date
    ).all()
    
    attendance_data = {}
    for record in records:
        attendance_data[record.subject] = record.status
    
    return {
        "date": date,
        "attendance": attendance_data
    }

@app.post("/attendance/sync")
def sync_attendance_to_db(data: dict, db: Session = Depends(get_db)):
    """Sync all attendance data from localStorage to database"""
    
    student_id = data.get("student_id")
    attendance_dict = data.get("attendance", {})
    
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id required")
    

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()
    
    # If student record doesn't exist in DB, create a stub student so sync can proceed.
    # This avoids failing sync when frontend has attendance for a student not yet present in DB.
    if not student:
        student = Student(
            student_id=student_id,
            name="Unknown",
            password="",
            roll_no="",
            class_name="",
            semester=""
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    
    count = 0
    for date_str, subjects in attendance_dict.items():
        try:
            parsed_date = parse_date(date_str)
        except ValueError:
            # skip unrecognized date formats
            continue

        for subject, status in subjects.items():
            if subject and status is not None:

                record = db.query(Attendance).filter(
                    Attendance.student_id == student_id,
                    Attendance.date == parsed_date,
                    Attendance.subject == subject
                ).first()

                if not record:
                    record = Attendance(
                        student_id=student_id,
                        date=parsed_date,
                        subject=subject,
                        status=status
                    )
                    db.add(record)
                else:
                    record.status = status

                count += 1
    
    db.commit()
    
    return {
        "message": "Attendance synced successfully",
        "records_synced": count
    }

