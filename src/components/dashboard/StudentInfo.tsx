import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import letterP from "@/assets/letter-p.png";
import { useEffect, useState } from "react";
import { calculateAttendanceStats } from "@/lib/attendanceManager";

interface StudentData {
  name: string;
  rollNo: string;
  className: string;
  semester: string;
  isAdmin?: boolean;
}

export function StudentInfo() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [stats, setStats] = useState({ totalClasses: 0, presentCount: 0, absentCount: 0, attendancePercentage: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Get student data from localStorage
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedStudent = JSON.parse(userData);
      setStudent(parsedStudent);
      
      // Calculate attendance stats
      const attendanceStats = calculateAttendanceStats(parsedStudent.rollNo);
      setStats(attendanceStats);
    }
  }, [refreshTrigger]);

  // Set up interval to refresh stats every second (detects changes from attendance updates)
  useEffect(() => {
    if (!student) return;
    
    const interval = setInterval(() => {
      const attendanceStats = calculateAttendanceStats(student.rollNo);
      setStats(attendanceStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [student]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/");
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  if (!student) {
    return (
      <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full relative shadow-2xl overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const attendance = stats.attendancePercentage;

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full relative shadow-2xl overflow-hidden flex flex-col">
      {/* Decorative gradient orb */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
      
      {/* Logout Button - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {student?.isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAdminPanel}
            className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
            title="Admin Panel"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Top Section - Icon and Details Side by Side */}
      <div className="flex items-start gap-4 relative z-10 mb-4 pt-8">
        {/* Avatar with P Letter - Medium Size */}
        <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-blue-500/30 border border-white/10 overflow-hidden flex-shrink-0">
          <img 
            src={letterP} 
            alt="P" 
            className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
          />
        </div>

        {/* Student Details on the Right */}
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{student.name}</h2>
            <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 flex-shrink-0">
              <span className="text-[10px] text-primary font-medium">Active</span>
            </div>
          </div>

          {/* Student Info - Vertical Stack */}
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              <span className="text-gray-500">Class:</span> <span className="text-white font-medium">{student.className}</span>
            </p>
            <p className="text-sm text-gray-400">
              <span className="text-gray-500">Semester:</span> <span className="text-white font-medium">{student.semester}</span>
            </p>
            <p className="text-sm text-gray-400">
              <span className="text-gray-500">Roll No:</span> <span className="text-white font-medium">{student.rollNo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />

      {/* Quick Stats - Bottom */}
      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <p className="text-2xl font-bold text-primary">{attendance}%</p>
          <p className="text-xs text-gray-500 mt-1">Attendance</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <p className="text-2xl font-bold text-emerald-400">{stats.presentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Present</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <p className="text-2xl font-bold text-red-400">{stats.absentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Absent</p>
        </div>
      </div>
    </div>
  );
}
