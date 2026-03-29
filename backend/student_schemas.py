from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, date

class LoginRequest(BaseModel):
    student_id: str
    password: str

class StudentResponse(BaseModel):
    studentId: str
    name: str
    rollNo: str
    className: str
    semester: str
    present: int
    absent: int

class AttendanceRecord(BaseModel):
    date: str
    subject: str
    status: Optional[bool] 

class AttendanceRequest(BaseModel):
    student_id: str
    date: str
    subject: str
    status: Optional[bool] 

class AttendanceResponse(BaseModel):
    id: int
    student_id: str
    date: date
    subject: str
    status: Optional[bool]
    updated_at: datetime

class StudentAttendanceData(BaseModel):
    """Student attendance data for a specific date"""
    rollNo: str
    date: str
    attendance: Dict[str, Optional[bool]] 


