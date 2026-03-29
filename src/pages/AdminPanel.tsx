import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  updateAttendance,
  getDateAttendance,
  validateAndRepairData,
  syncAttendanceToBackend,
} from "@/lib/attendanceManager";
import { apiCall } from "@/lib/api-client";

interface StudentInfo {
  studentId?: string;
  name: string;
  rollNo: string;
  className: string;
  semester: string;
}

// Day names mapping
const DAY_NAMES: { [key: string]: string } = {
  "Jan 19": "MON", "Jan 20": "TUE", "Jan 21": "WED", "Jan 22": "THUR", "Jan 23": "FRI", "Jan 24": "SAT",
  "Jan 26": "MON", "Jan 27": "TUE", "Jan 28": "WED", "Jan 29": "THUR", "Jan 30": "FRI", "Jan 31": "SAT",
  "Feb 02": "MON", "Feb 03": "TUE", "Feb 04": "WED", "Feb 05": "THUR", "Feb 06": "FRI", "Feb 07": "SAT",
  "Feb 09": "MON", "Feb 10": "TUE", "Feb 11": "WED", "Feb 12": "THUR", "Feb 13": "FRI", "Feb 14": "SAT",
  "Feb 16": "MON", "Feb 17": "TUE", "Feb 18": "WED", "Feb 19": "THUR", "Feb 20": "FRI", "Feb 21": "SAT",
  "Feb 23": "MON", "Feb 24": "TUE", "Feb 25": "WED", "Feb 26": "THUR", "Feb 27": "FRI", "Feb 28": "SAT",
  "Mar 02": "MON", "Mar 03": "TUE", "Mar 04": "WED", "Mar 05": "THUR", "Mar 06": "FRI", "Mar 07": "SAT",
  "Mar 09": "MON", "Mar 10": "TUE", "Mar 11": "WED", "Mar 12": "THUR", "Mar 13": "FRI", "Mar 14": "SAT",
  "Mar 16": "MON", "Mar 17": "TUE", "Mar 18": "WED", "Mar 19": "THUR", "Mar 20": "FRI", "Mar 21": "SAT",
  "Mar 23": "MON", "Mar 24": "TUE", "Mar 25": "WED", "Mar 26": "THUR", "Mar 27": "FRI", "Mar 28": "SAT",
  "Mar 30": "MON", "Mar 31": "TUE", "Apr 01": "WED", "Apr 02": "THUR", "Apr 03": "FRI", "Apr 04": "SAT",
  "Apr 06": "MON", "Apr 07": "TUE", "Apr 08": "WED", "Apr 09": "THUR", "Apr 10": "FRI", "Apr 11": "SAT",
  "Apr 13": "MON", "Apr 14": "TUE", "Apr 15": "WED", "Apr 16": "THUR", "Apr 17": "FRI", "Apr 18": "SAT",
};

// Subject schedule for each day - MON: ME, TUE: DBMS+MP, WED: DAA, THU: DAA+DBMS, FRI: ME+MP, SAT: FLAT
const SUBJECT_SCHEDULE: { [key: string]: string[] } = {
  "Jan 19": ["ME"],
  "Jan 20": ["DBMS", "MP"],
  "Jan 21": ["DAA"],
  "Jan 22": ["DAA", "DBMS"],
  "Jan 23": ["ME", "MP"],
  "Jan 24": ["FLAT"],
  "Jan 26": ["ME"],
  "Jan 27": ["DBMS", "MP"],
  "Jan 28": ["DAA"],
  "Jan 29": ["DAA", "DBMS"],
  "Jan 30": ["ME", "MP"],
  "Jan 31": ["FLAT"],
  "Feb 02": ["ME"],
  "Feb 03": ["DBMS", "MP"],
  "Feb 04": ["DAA"],
  "Feb 05": ["DAA", "DBMS"],
  "Feb 06": ["ME", "MP"],
  "Feb 07": ["FLAT"],
  "Feb 09": ["ME"],
  "Feb 10": ["DBMS", "MP"],
  "Feb 11": ["DAA"],
  "Feb 12": ["DAA", "DBMS"],
  "Feb 13": ["ME", "MP"],
  "Feb 14": ["FLAT"],
  "Feb 16": ["ME"],
  "Feb 17": ["DBMS", "MP"],
  "Feb 18": ["DAA"],
  "Feb 19": ["DAA", "DBMS"],
  "Feb 20": ["ME", "MP"],
  "Feb 21": ["FLAT"],
  "Feb 23": ["ME"],
  "Feb 24": ["DBMS", "MP"],
  "Feb 25": ["DAA"],
  "Feb 26": ["DAA", "DBMS"],
  "Feb 27": ["ME", "MP"],
  "Feb 28": ["FLAT"],
  "Mar 02": ["ME"],
  "Mar 03": ["DBMS", "MP"],
  "Mar 04": ["DAA"],
  "Mar 05": ["DAA", "DBMS"],
  "Mar 06": ["ME", "MP"],
  "Mar 07": ["FLAT"],
  "Mar 09": ["ME"],
  "Mar 10": ["DBMS", "MP"],
  "Mar 11": ["DAA"],
  "Mar 12": ["DAA", "DBMS"],
  "Mar 13": ["ME", "MP"],
  "Mar 14": ["FLAT"],
  "Mar 16": ["ME"],
  "Mar 17": ["DBMS", "MP"],
  "Mar 18": ["DAA"],
  "Mar 19": ["DAA", "DBMS"],
  "Mar 20": ["ME", "MP"],
  "Mar 21": ["FLAT"],
  "Mar 23": ["ME"],
  "Mar 24": ["DBMS", "MP"],
  "Mar 25": ["DAA"],
  "Mar 26": ["DAA", "DBMS"],
  "Mar 27": ["ME", "MP"],
  "Mar 28": ["FLAT"],
  "Mar 30": ["ME"],
  "Mar 31": ["DBMS", "MP"],
  "Apr 01": ["DAA"],
  "Apr 02": ["DAA", "DBMS"],
  "Apr 03": ["ME", "MP"],
  "Apr 04": ["FLAT"],
  "Apr 06": ["ME"],
  "Apr 07": ["DBMS", "MP"],
  "Apr 08": ["DAA"],
  "Apr 09": ["DAA", "DBMS"],
  "Apr 10": ["ME", "MP"],
  "Apr 11": ["FLAT"],
  "Apr 13": ["ME"],
  "Apr 14": ["DBMS", "MP"],
  "Apr 15": ["DAA"],
  "Apr 16": ["DAA", "DBMS"],
  "Apr 17": ["ME", "MP"],
  "Apr 18": ["FLAT"],
};

// Lab schedule - DEPRECATED (use LAB_SCHEDULE_DETAILED instead)
// Kept for backwards compatibility - MON: DBMS/ALC, TUE: WT/DBMS, WED: WT/ALC
const LAB_SCHEDULE: { [key: string]: string[] } = {
  "Jan 19": ["DBMS/ALC", "WT/DBMS"],
  "Jan 20": ["WT/ALC"],
  "Jan 21": [],
  "Jan 22": [],
  "Jan 23": [],
  "Jan 24": [],
  "Jan 26": ["ALC", "DBMS_LAB"],
  "Jan 27": ["WT"],
  "Jan 28": [],
  "Jan 29": [],
  "Jan 30": [],
  "Jan 31": [],
  "Feb 02": ["ALC", "DBMS_LAB"],
  "Feb 03": ["WT"],
  "Feb 04": [],
  "Feb 05": [],
  "Feb 06": [],
  "Feb 07": [],
  "Feb 09": ["ALC", "DBMS_LAB"],
  "Feb 10": ["WT"],
  "Feb 11": [],
  "Feb 12": [],
  "Feb 13": [],
  "Feb 14": [],
  "Feb 16": ["ALC", "DBMS_LAB"],
  "Feb 17": ["WT"],
  "Feb 18": [],
  "Feb 19": [],
  "Feb 20": [],
  "Feb 21": [],
  "Feb 23": ["ALC", "DBMS_LAB"],
  "Feb 24": ["WT"],
  "Feb 25": [],
  "Feb 26": [],
  "Feb 27": [],
  "Feb 28": [],
  "Mar 02": ["ALC", "DBMS_LAB"],
  "Mar 03": ["WT"],
  "Mar 04": [],
  "Mar 05": [],
  "Mar 06": [],
  "Mar 07": [],
  "Mar 09": ["ALC", "DBMS_LAB"],
  "Mar 10": ["WT"],
  "Mar 11": [],
  "Mar 12": [],
  "Mar 13": [],
  "Mar 14": [],
  "Mar 16": ["ALC", "DBMS_LAB"],
  "Mar 17": ["WT"],
  "Mar 18": [],
  "Mar 19": [],
  "Mar 20": [],
  "Mar 21": [],
  "Mar 23": ["ALC", "DBMS_LAB"],
  "Mar 24": ["WT"],
  "Mar 25": [],
  "Mar 26": [],
  "Mar 27": [],
  "Mar 28": [],
  "Mar 30": ["ALC", "DBMS_LAB"],
  "Mar 31": ["WT"],
  "Apr 01": [],
  "Apr 02": [],
  "Apr 03": [],
  "Apr 04": [],
  "Apr 06": ["ALC", "DBMS_LAB"],
  "Apr 07": ["WT"],
  "Apr 08": [],
  "Apr 09": [],
  "Apr 10": [],
  "Apr 11": [],
  "Apr 13": ["ALC", "DBMS_LAB"],
  "Apr 14": ["WT"],
  "Apr 15": [],
  "Apr 16": [],
  "Apr 17": [],
  "Apr 18": [],
};

const WEEKS = [
  {
    name: "Week 1",
    dates: ["Jan 19", "Jan 20", "Jan 21", "Jan 22", "Jan 23", "Jan 24"],
  },
  {
    name: "Week 2",
    dates: ["Jan 26", "Jan 27", "Jan 28", "Jan 29", "Jan 30", "Jan 31"],
  },
  {
    name: "Week 3",
    dates: ["Feb 02", "Feb 03", "Feb 04", "Feb 05", "Feb 06", "Feb 07"],
  },
  {
    name: "Week 4",
    dates: ["Feb 09", "Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14"],
  },
  {
    name: "Week 5",
    dates: ["Feb 16", "Feb 17", "Feb 18", "Feb 19", "Feb 20", "Feb 21"],
  },
  {
    name: "Week 6",
    dates: ["Feb 23", "Feb 24", "Feb 25", "Feb 26", "Feb 27", "Feb 28"],
  },
  {
    name: "Week 7",
    dates: ["Mar 02", "Mar 03", "Mar 04", "Mar 05", "Mar 06", "Mar 07"],
  },
  {
    name: "Week 8",
    dates: ["Mar 09", "Mar 10", "Mar 11", "Mar 12", "Mar 13", "Mar 14"],
  },
  {
    name: "Week 9",
    dates: ["Mar 16", "Mar 17", "Mar 18", "Mar 19", "Mar 20", "Mar 21"],
  },
  {
    name: "Week 10",
    dates: ["Mar 23", "Mar 24", "Mar 25", "Mar 26", "Mar 27", "Mar 28"],
  },
  {
    name: "Week 11",
    dates: ["Mar 30", "Mar 31", "Apr 01", "Apr 02", "Apr 03", "Apr 04"],
  },
  {
    name: "Week 12",
    dates: ["Apr 06", "Apr 07", "Apr 08", "Apr 09", "Apr 10", "Apr 11"],
  },
  {
    name: "Week 13",
    dates: ["Apr 13", "Apr 14", "Apr 15", "Apr 16", "Apr 17", "Apr 18"],
  },
];

// Lab schedule - labs on Monday (ALC), Tuesday (DBMS), Wednesday (WT) only - 13 weeks
const LAB_WEEKS = [
  {
    name: "Week 1",
    dates: ["Jan 19", "Jan 20", "Jan 21"], // MON, TUE, WED
  },
  {
    name: "Week 2",
    dates: ["Jan 26", "Jan 27", "Jan 28"], // MON, TUE, WED
  },
  {
    name: "Week 3",
    dates: ["Feb 02", "Feb 03", "Feb 04"], // MON, TUE, WED
  },
  {
    name: "Week 4",
    dates: ["Feb 09", "Feb 10", "Feb 11"], // MON, TUE, WED
  },
  {
    name: "Week 5",
    dates: ["Feb 16", "Feb 17", "Feb 18"], // MON, TUE, WED
  },
  {
    name: "Week 6",
    dates: ["Feb 23", "Feb 24", "Feb 25"], // MON, TUE, WED
  },
  {
    name: "Week 7",
    dates: ["Mar 02", "Mar 03", "Mar 04"], // MON, TUE, WED
  },
  {
    name: "Week 8",
    dates: ["Mar 09", "Mar 10", "Mar 11"], // MON, TUE, WED
  },
  {
    name: "Week 9",
    dates: ["Mar 16", "Mar 17", "Mar 18"], // MON, TUE, WED
  },
  {
    name: "Week 10",
    dates: ["Mar 23", "Mar 24", "Mar 25"], // MON, TUE, WED
  },
  {
    name: "Week 11",
    dates: ["Mar 30", "Mar 31", "Apr 01"], // MON, TUE, WED
  },
  {
    name: "Week 12",
    dates: ["Apr 06", "Apr 07", "Apr 08"], // MON, TUE, WED
  },
  {
    name: "Week 13",
    dates: ["Apr 13", "Apr 14", "Apr 15"], // MON, TUE, WED
  },
];

// Lab schedule mapping - MON=DBMS/ALC, TUE=WT/DBMS, WED=WT/ALC
const LAB_SCHEDULE_DETAILED: { [key: string]: string[] } = {
  // Week 1
  "Jan 19": ["DBMS/ALC"],    // MON
  "Jan 20": ["WT/DBMS"],   // TUE
  "Jan 21": ["WT/ALC"],     // WED
  // Week 2
  "Jan 26": ["DBMS/ALC"],    // MON
  "Jan 27": ["WT/DBMS"],   // TUE
  "Jan 28": ["WT/ALC"],     // WED
  // Week 3
  "Feb 02": ["DBMS/ALC"],    // MON
  "Feb 03": ["WT/DBMS"],   // TUE
  "Feb 04": ["WT/ALC"],     // WED
  // Week 4
  "Feb 09": ["DBMS/ALC"],    // MON
  "Feb 10": ["WT/DBMS"],   // TUE
  "Feb 11": ["WT/ALC"],     // WED
  // Week 5
  "Feb 16": ["DBMS/ALC"],    // MON
  "Feb 17": ["WT/DBMS"],   // TUE
  "Feb 18": ["WT/ALC"],     // WED
  // Week 6
  "Feb 23": ["DBMS/ALC"],    // MON
  "Feb 24": ["WT/DBMS"],   // TUE
  "Feb 25": ["WT/ALC"],     // WED
  // Week 7
  "Mar 02": ["DBMS/ALC"],    // MON
  "Mar 03": ["WT/DBMS"],   // TUE
  "Mar 04": ["WT/ALC"],     // WED
  // Week 8
  "Mar 09": ["DBMS/ALC"],    // MON
  "Mar 10": ["WT/DBMS"],   // TUE
  "Mar 11": ["WT/ALC"],     // WED
  // Week 9
  "Mar 16": ["DBMS/ALC"],    // MON
  "Mar 17": ["WT/DBMS"],   // TUE
  "Mar 18": ["WT/ALC"],     // WED
  // Week 10
  "Mar 23": ["DBMS/ALC"],    // MON
  "Mar 24": ["WT/DBMS"],   // TUE
  "Mar 25": ["WT/ALC"],     // WED
  // Week 11
  "Mar 30": ["DBMS/ALC"],    // MON
  "Mar 31": ["WT/DBMS"],   // TUE
  "Apr 01": ["WT/ALC"],     // WED
  // Week 12
  "Apr 06": ["DBMS/ALC"],    // MON
  "Apr 07": ["WT/DBMS"],   // TUE
  "Apr 08": ["WT/ALC"],     // WED
  // Week 13
  "Apr 13": ["DBMS/ALC"],    // MON
  "Apr 14": ["WT/DBMS"],   // TUE
  "Apr 15": ["WT/ALC"],     // WED
};

export function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<string>("Week 1");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceType, setAttendanceType] = useState<"subject" | "lab">("subject");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for refreshing data

  useEffect(() => {
    // Get all students from database via backend API
    const userData = localStorage.getItem("userData");
    if (!userData) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userData);
    
    // Check if user is admin
    if (!user.isAdmin) {
      navigate("/login");
      return;
    }

    // Validate and repair data on page load
    const validation = validateAndRepairData();
    if (validation.repaired) {
      console.log("Attendance data was repaired on admin panel load");
    }

    // Fetch all students from backend
    const fetchStudents = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        // Use retrying API client for production reliability
        const data = await apiCall(`${backendUrl}/students`);
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        // Fallback to just the admin user if API fails
        setStudents([user]);
      }
    };

    fetchStudents();
  }, [navigate]);

  // Filter students based on search query
  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by rollNo numerically, handling both string and number formats
      const aNum = parseInt(a.rollNo, 10);
      const bNum = parseInt(b.rollNo, 10);
      if (isNaN(aNum) || isNaN(bNum)) {
        return a.rollNo.localeCompare(b.rollNo);
      }
      return aNum - bNum;
    });

  const handleSelectStudent = (student: StudentInfo) => {
    setSelectedStudent(student);
    setRefreshTrigger((prev) => prev + 1); // Refresh data when selecting student
  };

  const handleAttendanceChange = (date: string, subject: string, status: boolean | null) => {
    if (!selectedStudent) return;
    
    try {
      // Update local storage
      updateAttendance(selectedStudent.rollNo, date, subject, status);
      
      // Sync to backend
      const syncToBackend = async () => {
        const studentIdForSync = selectedStudent.studentId || selectedStudent.rollNo;
        const synced = await syncAttendanceToBackend(studentIdForSync, date, subject, status);
        
        if (synced) {
          // Show success message based on status
          let message = "";
          if (status === true) {
            message = `✓ ${subject} marked as PRESENT for ${date}`;
          } else if (status === false) {
            message = `✗ ${subject} marked as ABSENT for ${date}`;
          } else {
            message = `${subject} attendance cleared for ${date}`;
          }
          
          toast({
            title: "Attendance Updated",
            description: message,
            duration: 2000,
          });
        } else {
          toast({
            title: "Synced Locally",
            description: "Data saved locally. Backend sync pending.",
            duration: 2000,
          });
        }
      };
      
      syncToBackend();
      
      // Trigger refresh to ensure UI updates
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating attendance.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getAttendanceStatus = (date: string, subject: string): boolean | null => {
    if (!selectedStudent) return null;
    const dateAttendance = getDateAttendance(selectedStudent.rollNo, date);
    return dateAttendance[subject] ?? null;
  };

  const getDayName = (date: string): string => {
    const dayMap: { [key: string]: string } = {
      "Jan 19": "MON",
      "Jan 20": "TUE",
      "Jan 21": "WED",
      "Jan 22": "THUR",
      "Jan 23": "FRI",
      "Jan 24": "SAT",
      "Jan 26": "MON",
      "Jan 27": "TUE",
      "Jan 28": "WED",
      "Jan 29": "THUR",
      "Jan 30": "FRI",
      "Jan 31": "SAT",
      "Feb 02": "MON",
      "Feb 03": "TUE",
      "Feb 04": "WED",
      "Feb 05": "THUR",
      "Feb 06": "FRI",
      "Feb 07": "SAT",
      "Feb 09": "MON",
      "Feb 10": "TUE",
      "Feb 11": "WED",
      "Feb 12": "THUR",
      "Feb 13": "FRI",
      "Feb 14": "SAT",
      "Feb 16": "MON",
      "Feb 17": "TUE",
      "Feb 18": "WED",
      "Feb 19": "THUR",
      "Feb 20": "FRI",
      "Feb 21": "SAT",
      "Feb 23": "MON",
      "Feb 24": "TUE",
      "Feb 25": "WED",
      "Feb 26": "THUR",
      "Feb 27": "FRI",
      "Feb 28": "SAT",
      "Mar 02": "MON",
      "Mar 03": "TUE",
      "Mar 04": "WED",
      "Mar 05": "THUR",
      "Mar 06": "FRI",
      "Mar 07": "SAT",
      "Mar 09": "MON",
      "Mar 10": "TUE",
      "Mar 11": "WED",
      "Mar 12": "THUR",
      "Mar 13": "FRI",
      "Mar 14": "SAT",
      "Mar 16": "MON",
      "Mar 17": "TUE",
      "Mar 18": "WED",
      "Mar 19": "THUR",
      "Mar 20": "FRI",
      "Mar 21": "SAT",
      "Mar 23": "MON",
      "Mar 24": "TUE",
      "Mar 25": "WED",
      "Mar 26": "THUR",
      "Mar 27": "FRI",
      "Mar 28": "SAT",
      "Mar 30": "MON",
      "Mar 31": "TUE",
      "Apr 01": "WED",
      "Apr 02": "THUR",
      "Apr 03": "FRI",
      "Apr 04": "SAT",
      "Apr 06": "MON",
      "Apr 07": "TUE",
      "Apr 08": "WED",
      "Apr 09": "THUR",
      "Apr 10": "FRI",
      "Apr 11": "SAT",
      "Apr 13": "MON",
      "Apr 14": "TUE",
      "Apr 15": "WED",
      "Apr 16": "THUR",
      "Apr 17": "FRI",
      "Apr 18": "SAT",
    };
    return dayMap[date] || "";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Admin Panel - Update Attendance</h1>
          </div>
          <div className="text-xs text-gray-500">
            Data Last Updated: {refreshTrigger > 0 ? new Date().toLocaleTimeString() : "Ready"}
          </div>
        </div>

        {/* Attendance Type Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setAttendanceType("subject")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              attendanceType === "subject"
                ? "bg-primary text-black"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Subject Attendance
          </Button>
          <Button
            onClick={() => setAttendanceType("lab")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              attendanceType === "lab"
                ? "bg-primary text-black"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Lab Attendance
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student Selection Panel */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-xl bg-black/70 border border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Select Student</h2>
              
              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>

              {/* Students List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                  <div
                    key={student.rollNo}
                    onClick={() => handleSelectStudent(student)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStudent?.rollNo === student.rollNo
                        ? "bg-primary/30 border border-primary"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-medium text-white text-sm">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.rollNo}</p>
                  </div>
                ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-500">No students found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Attendance Update Panel */}
          <div className="lg:col-span-3">
            {!selectedStudent ? (
              <Card className="backdrop-blur-xl bg-black/70 border border-white/10 p-8 text-center">
                <p className="text-gray-400">Enter a student Roll Number and click "Load Student" to update attendance</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Student Info */}
                <Card className="backdrop-blur-xl bg-black/70 border border-white/10 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-white">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Roll No</p>
                      <p className="text-sm font-medium text-white">{selectedStudent.rollNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Class</p>
                      <p className="text-sm font-medium text-white">{selectedStudent.className}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Semester</p>
                      <p className="text-sm font-medium text-white">{selectedStudent.semester}</p>
                    </div>
                  </div>
                </Card>

                {/* Weeks and Dates */}
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {(attendanceType === "subject" ? WEEKS : LAB_WEEKS).map((week) => (
                    <Card
                      key={week.name}
                      className="backdrop-blur-xl bg-black/70 border border-white/10 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedWeek(expandedWeek === week.name ? "" : week.name)
                        }
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <h3 className="font-semibold text-white">{week.name}</h3>
                        <span className="text-gray-400">
                          {expandedWeek === week.name ? "▼" : "▶"}
                        </span>
                      </button>

                      {expandedWeek === week.name && (
                        <div className="border-t border-white/10 p-4 space-y-3">
                          {week.dates.map((date) => {
                            const subjects = attendanceType === "subject" 
                              ? (SUBJECT_SCHEDULE[date] || [])
                              : (LAB_SCHEDULE_DETAILED[date] || []);
                            
                            return (
                              <div key={date} className="p-3 bg-white/5 rounded-lg">
                                <p className="text-sm font-medium text-white mb-2">
                                  {date} {getDayName(date)}
                                </p>
                                {subjects.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {subjects.map((subject) => {
                                      const status = getAttendanceStatus(date, subject);
                                      return (
                                        <div
                                          key={subject}
                                          className="flex items-center justify-between bg-white/5 p-2 rounded"
                                        >
                                          <span className="text-xs text-gray-300 font-medium">{subject}</span>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() =>
                                                handleAttendanceChange(date, subject, true)
                                              }
                                              className={`p-1.5 rounded transition-colors ${
                                                status === true
                                                  ? "bg-primary text-white"
                                                  : "bg-white/10 text-gray-400 hover:bg-primary/50"
                                              }`}
                                              title="Mark Present"
                                            >
                                              <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleAttendanceChange(date, subject, false)
                                              }
                                              className={`p-1.5 rounded transition-colors ${
                                                status === false
                                                  ? "bg-destructive text-white"
                                                  : "bg-white/10 text-gray-400 hover:bg-destructive/50"
                                              }`}
                                              title="Mark Absent"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleAttendanceChange(date, subject, null)
                                              }
                                              className={`px-1.5 rounded text-xs transition-colors ${
                                                status === null
                                                  ? "bg-gray-500 text-white"
                                                  : "bg-white/10 text-gray-400 hover:bg-gray-500/50"
                                              }`}
                                              title="Clear"
                                            >
                                              -
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">No classes scheduled</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
