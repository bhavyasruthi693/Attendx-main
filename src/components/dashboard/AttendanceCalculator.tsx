import { Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateAttendanceStats } from "@/lib/attendanceManager";

export function AttendanceCalculator() {
  const [stats, setStats] = useState({ totalClasses: 0, presentCount: 0, absentCount: 0, attendancePercentage: 0 });
  const [studentRollNo, setStudentRollNo] = useState<string>("");

  useEffect(() => {
    // Get student roll number from localStorage
    const userData = localStorage.getItem("userData");
    if (userData) {
      const student = JSON.parse(userData);
      setStudentRollNo(student.rollNo);
    }
  }, []);

  // Update stats every second to detect attendance changes
  useEffect(() => {
    if (!studentRollNo) return;

    const updateStats = () => {
      const attendanceStats = calculateAttendanceStats(studentRollNo);
      setStats(attendanceStats);
    };

    updateStats(); // Initial update
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [studentRollNo]);

  const percentage = stats.attendancePercentage;
  const radius = 55;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Calculator className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-gray-400">
          Attendance Calculator
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="space-y-3 flex-1">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total classes</p>
            <p className="text-2xl font-bold text-white">{stats.totalClasses}</p>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Classes attended</p>
            <p className="text-2xl font-bold text-white">{stats.presentCount}</p>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            {/* Background circle */}
            <circle
              stroke="rgba(255,255,255,0.1)"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              stroke="url(#calc-gradient)"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="calc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">{percentage}%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">percentage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
