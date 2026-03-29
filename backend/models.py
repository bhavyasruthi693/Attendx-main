from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True)
    password = Column(String(100))

    name = Column(String(100))
    roll_no = Column(String(50), index=True)
    class_name = Column(String(50))
    semester = Column(String(20))

    present = Column(Integer, default=0)
    absent = Column(Integer, default=0)
    

    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    
    # Create composite index for common queries
    __table_args__ = (
        Index('idx_student_id', 'student_id'),
        Index('idx_roll_no', 'roll_no'),
    )

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("students.student_id"), index=True)
    date = Column(Date, index=True)
    subject = Column(String(50), index=True) 
    status = Column(Boolean, nullable=True)  

    updated_at = Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    

    student = relationship("Student", back_populates="attendance_records")
    
    # Create composite indexes for common queries
    __table_args__ = (
        Index('idx_attendance_student_date', 'student_id', 'date'),
        Index('idx_attendance_student_subject', 'student_id', 'subject'),
        Index('idx_attendance_date_subject', 'date', 'subject'),
    )

