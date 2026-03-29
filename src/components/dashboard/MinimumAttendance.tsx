import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
} from "recharts";
import { useEffect, useState } from "react";
import { Database, Pencil, Cpu, FileText, TrendingUp, Code, Globe, Terminal, AlertCircle, TrendingDown } from "lucide-react";
import { getStudentAttendance } from "@/lib/attendanceManager";

// Week definitions (same as AdminPanel)
const WEEKS = [
  { name: "Week 1", dates: ["Jan 19", "Jan 20", "Jan 21", "Jan 22", "Jan 23", "Jan 24"] },
  { name: "Week 2", dates: ["Jan 26", "Jan 27", "Jan 28", "Jan 29", "Jan 30", "Jan 31"] },
  { name: "Week 3", dates: ["Feb 02", "Feb 03", "Feb 04", "Feb 05", "Feb 06", "Feb 07"] },
  { name: "Week 4", dates: ["Feb 09", "Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14"] },
  { name: "Week 5", dates: ["Feb 16", "Feb 17", "Feb 18", "Feb 19", "Feb 20", "Feb 21"] },
  { name: "Week 6", dates: ["Feb 23", "Feb 24", "Feb 25", "Feb 26", "Feb 27", "Feb 28"] },
  { name: "Week 7", dates: ["Mar 02", "Mar 03", "Mar 04", "Mar 05", "Mar 06", "Mar 07"] },
  { name: "Week 8", dates: ["Mar 09", "Mar 10", "Mar 11", "Mar 12", "Mar 13", "Mar 14"] },
  { name: "Week 9", dates: ["Mar 16", "Mar 17", "Mar 18", "Mar 19", "Mar 20", "Mar 21"] },
  { name: "Week 10", dates: ["Mar 23", "Mar 24", "Mar 25", "Mar 26", "Mar 27", "Mar 28"] },
  { name: "Week 11", dates: ["Mar 30", "Mar 31", "Apr 01", "Apr 02", "Apr 03", "Apr 04"] },
  { name: "Week 12", dates: ["Apr 06", "Apr 07", "Apr 08", "Apr 09", "Apr 10", "Apr 11"] },
  { name: "Week 13", dates: ["Apr 13", "Apr 14", "Apr 15", "Apr 16", "Apr 17", "Apr 18"] },
];

const SUBJECTS = ["DBMS", "DAA", "MP", "FLAT", "ME"];
const LABS = ["DBMS/ALC", "WT/DBMS", "WT/ALC"];
const TARGET_PERCENT = 75;

// Icon mapping for subjects
const subjectIcons: { [key: string]: any } = {
  DBMS: Database,
  DAA: Pencil,
  MP: Cpu,
  FLAT: FileText,
  ME: TrendingUp,
};

// Icon mapping for labs
const labIcons: { [key: string]: any } = {
  "DBMS/ALC": Terminal,
  "WT/DBMS": Database,
  "WT/ALC": Globe,
};

// Color mapping for subjects
const subjectColors: { [key: string]: string } = {
  DBMS: "from-slate-600 to-slate-700",
  DAA: "from-zinc-600 to-zinc-700",
  MP: "from-gray-600 to-gray-700",
  FLAT: "from-neutral-600 to-neutral-700",
  ME: "from-stone-600 to-stone-700",
};

// Color mapping for labs
const labColors: { [key: string]: string } = {
  "DBMS/ALC": "from-emerald-700 to-emerald-800",
  "WT/DBMS": "from-teal-700 to-teal-800",
  "WT/ALC": "from-cyan-700 to-cyan-800",
};

// Helper: Calculate trend (increasing/stable/decreasing) based on last 3 weeks vs overall
function calculateTrend(weeklyAttendances: number[]): "increasing" | "stable" | "decreasing" {
  const nonZeroWeeks = weeklyAttendances.filter((w) => w > 0);
  if (nonZeroWeeks.length < 2) return "stable";

  const overall = nonZeroWeeks.reduce((a, b) => a + b, 0) / nonZeroWeeks.length;
  const last3Weeks = nonZeroWeeks.slice(-3);
  const last3Avg = last3Weeks.length > 0 ? last3Weeks.reduce((a, b) => a + b, 0) / last3Weeks.length : 0;

  if (last3Avg > overall * 1.1) return "increasing";
  if (last3Avg < overall * 0.9) return "decreasing";
  return "stable";
}

// Helper: Classify risk status based on remaining requirement
function classifyRisk(
  attended: number,
  total: number,
  currentWeek: number
): "SAFE" | "WARNING" | "RISK" {
  const minRequired = Math.ceil((TARGET_PERCENT / 100) * total);
  const remainingNeeded = Math.max(0, minRequired - attended);
  const remainingWeeks = Math.max(1, 13 - currentWeek);

  // Estimate classes per week for this subject (approximate)
  const classesPerWeek = total > 0 ? Math.ceil(total / 13) : 1;
  const recommendedPerWeek = remainingWeeks > 0 ? Math.ceil(remainingNeeded / remainingWeeks) : 0;

  if (recommendedPerWeek <= Math.max(1, classesPerWeek - 1)) return "SAFE";
  if (recommendedPerWeek === classesPerWeek) return "WARNING";
  return "RISK";
}

// Calculate all data from attendance
function computeMinimumAttendanceData(rollNo: string | null) {
  const result = {
    barData: [] as {
      name: string;
      subjectAttended: number;
      labAttended: number;
      required?: number;
    }[],
    subjectStats: [] as {
      code: string;
      attended: number;
      required: number;
      icon: any;
      color: string;
      trend?: "increasing" | "stable" | "decreasing";
      riskStatus?: "SAFE" | "WARNING" | "RISK";
      recommendedPerWeek?: number;
    }[],
    labStats: [] as {
      code: string;
      attended: number;
      required: number;
      icon: any;
      color: string;
      trend?: "increasing" | "stable" | "decreasing";
      riskStatus?: "SAFE" | "WARNING" | "RISK";
      recommendedPerWeek?: number;
    }[],
    currentAttendance: 0,
    currentWeek: 1,
  };

  if (!rollNo) return result;

  const studentData = getStudentAttendance(rollNo);

  // Find current week (count weeks with at least one record)
  let currentWeek = 1;
  for (let i = WEEKS.length - 1; i >= 0; i--) {
    const week = WEEKS[i];
    let hasData = false;
    for (const date of week.dates) {
      if (studentData[date]) {
        hasData = true;
        break;
      }
    }
    if (hasData) {
      currentWeek = i + 1;
      break;
    }
  }
  result.currentWeek = currentWeek;

  // 1. Compute weekly data (bar chart)
  for (let i = 0; i < WEEKS.length; i++) {
    const week = WEEKS[i];
    let subjectAttended = 0;
    let labAttended = 0;

    for (const date of week.dates) {
      const dayAttendance = studentData[date] || {};

      // Count subject attendance (present only)
      for (const subject of SUBJECTS) {
        const status = dayAttendance[subject];
        if (status === true) {
          subjectAttended++;
        }
      }

      // Count lab attendance (present only)
      for (const lab of LABS) {
        const status = dayAttendance[lab];
        if (status === true) {
          labAttended++;
        }
      }
    }

    result.barData.push({
      name: `W${i + 1}`,
      subjectAttended,
      labAttended,
      required: 3, // Approximate required for visualization
    });
  }

  // 2. Compute subject stats with trend and risk analysis
  for (const subject of SUBJECTS) {
    let total = 0;
    let present = 0;
    const weeklyAttendances: number[] = [];

    // Collect weekly attendance for trend analysis
    for (let i = 0; i < WEEKS.length; i++) {
      const week = WEEKS[i];
      let weekPresent = 0;
      for (const date of week.dates) {
        const dayAttendance = studentData[date] || {};
        const status = dayAttendance[subject];
        if (status === true) weekPresent++;
      }
      weeklyAttendances.push(weekPresent);
    }

    // Count overall attendance
    for (const date in studentData) {
      const dayAttendance = studentData[date];
      const status = dayAttendance[subject];
      if (status !== null && status !== undefined) {
        total++;
        if (status === true) present++;
      }
    }

    const minRequired = Math.ceil((TARGET_PERCENT / 100) * total);
    const required = Math.max(0, minRequired - present);
    const trend = calculateTrend(weeklyAttendances);
    const riskStatus = classifyRisk(present, total, currentWeek);
    const remainingNeeded = Math.max(0, minRequired - present);
    const remainingWeeks = Math.max(1, 13 - currentWeek);
    const recommendedPerWeek = remainingWeeks > 0 ? Math.ceil(remainingNeeded / remainingWeeks) : 0;

    result.subjectStats.push({
      code: subject,
      attended: present,
      required,
      icon: subjectIcons[subject],
      color: subjectColors[subject],
      trend,
      riskStatus,
      recommendedPerWeek,
    });
  }

  // 3. Compute lab stats with trend and risk analysis
  for (const lab of LABS) {
    let total = 0;
    let present = 0;
    const weeklyAttendances: number[] = [];

    // Collect weekly attendance for trend analysis
    for (let i = 0; i < WEEKS.length; i++) {
      const week = WEEKS[i];
      let weekPresent = 0;
      for (const date of week.dates) {
        const dayAttendance = studentData[date] || {};
        const status = dayAttendance[lab];
        if (status === true) weekPresent++;
      }
      weeklyAttendances.push(weekPresent);
    }

    // Count overall attendance
    for (const date in studentData) {
      const dayAttendance = studentData[date];
      const status = dayAttendance[lab];
      if (status !== null && status !== undefined) {
        total++;
        if (status === true) present++;
      }
    }

    const minRequired = Math.ceil((TARGET_PERCENT / 100) * total);
    const required = Math.max(0, minRequired - present);
    const trend = calculateTrend(weeklyAttendances);
    const riskStatus = classifyRisk(present, total, currentWeek);
    const remainingNeeded = Math.max(0, minRequired - present);
    const remainingWeeks = Math.max(1, 13 - currentWeek);
    const recommendedPerWeek = remainingWeeks > 0 ? Math.ceil(remainingNeeded / remainingWeeks) : 0;

    result.labStats.push({
      code: lab,
      attended: present,
      required,
      icon: labIcons[lab],
      color: labColors[lab],
      trend,
      riskStatus,
      recommendedPerWeek,
    });
  }

  // 4. Compute current overall attendance percentage
  let totalAllClasses = 0;
  let presentAllClasses = 0;
  for (const date in studentData) {
    const dayAttendance = studentData[date];
    for (const key in dayAttendance) {
      const status = dayAttendance[key];
      if (status !== null && status !== undefined) {
        totalAllClasses++;
        if (status === true) presentAllClasses++;
      }
    }
  }
  result.currentAttendance = totalAllClasses > 0 ? Math.round((presentAllClasses / totalAllClasses) * 100) : 0;

  return result;
}

export function MinimumAttendance() {
  const [barData, setBarData] = useState<
    { name: string; subjectAttended: number; labAttended: number; required?: number }[]
  >([]);
  const [subjectStats, setSubjectStats] = useState<
    {
      code: string;
      attended: number;
      required: number;
      icon: any;
      color: string;
      trend?: "increasing" | "stable" | "decreasing";
      riskStatus?: "SAFE" | "WARNING" | "RISK";
      recommendedPerWeek?: number;
    }[]
  >([]);
  const [labStats, setLabStats] = useState<
    {
      code: string;
      attended: number;
      required: number;
      icon: any;
      color: string;
      trend?: "increasing" | "stable" | "decreasing";
      riskStatus?: "SAFE" | "WARNING" | "RISK";
      recommendedPerWeek?: number;
    }[]
  >([]);
  const [currentAttendance, setCurrentAttendance] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    const rollNo = userData ? JSON.parse(userData).rollNo : null;

    // Update immediately and every 1s
    const update = () => {
      const userData = localStorage.getItem("userData");
      const rollNo = userData ? JSON.parse(userData).rollNo : null;
      const data = computeMinimumAttendanceData(rollNo);
      setBarData(data.barData);
      setSubjectStats(data.subjectStats);
      setLabStats(data.labStats);
      setCurrentAttendance(data.currentAttendance);
      setCurrentWeek(data.currentWeek);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full flex flex-col shadow-2xl">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">
          Minimum Attendance to Acquire
        </h3>
        <div className="flex items-center gap-4 text-sm mt-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Current:</span>
            <span className="text-cyan-400 font-bold">{currentAttendance}%</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Target:</span>
            <span className="text-emerald-400 font-bold">{TARGET_PERCENT}%</span>
          </div>
        </div>
      </div>

      {/* Dark Bar Chart */}
      <div className="flex-1 min-h-[120px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#4b5563", fontSize: 9 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#4b5563", fontSize: 9 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                color: "white",
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => [
                `${value} classes`, 
                name === 'subjectAttended' ? 'Subjects' : 'Labs'
              ]}
            />
            <Bar dataKey="subjectAttended" radius={[4, 4, 0, 0]} barSize={8} fill="#0891b2" />
            <Bar dataKey="labAttended" radius={[4, 4, 0, 0]} barSize={8} fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subjects Section */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Subjects</p>
        <div className="grid grid-cols-5 gap-1.5">
          {subjectStats.map((stat) => {
            const riskColors = {
              SAFE: "text-emerald-400",
              WARNING: "text-amber-400",
              RISK: "text-red-400",
            };
            return (
              <div 
                key={stat.code} 
                className="backdrop-blur-md bg-black/60 border border-white/5 rounded-lg p-2 text-center hover:bg-white/5 transition-colors"
              >
                <div
                  className={`w-6 h-6 mx-auto rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1 shadow-lg`}
                >
                  <stat.icon className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] font-medium text-white mb-1">{stat.code}</p>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-xs font-bold text-emerald-400">
                      {stat.attended}
                    </span>
                    <span className="text-[8px] text-gray-500">att</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-xs font-bold text-amber-400">
                      {stat.required}
                    </span>
                    <span className="text-[8px] text-gray-500">req</span>
                  </div>
                  {stat.riskStatus && (
                    <div className={`text-[9px] font-bold mt-0.5 ${riskColors[stat.riskStatus]}`}>
                      {stat.riskStatus === "SAFE" ? "✓ Safe" : stat.riskStatus === "WARNING" ? "! Attend" : "✗ Risk"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labs Section */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Labs</p>
        <div className="grid grid-cols-3 gap-2">
          {labStats.map((stat) => {
            const riskColors = {
              SAFE: "text-emerald-400",
              WARNING: "text-amber-400",
              RISK: "text-red-400",
            };
            return (
              <div 
                key={stat.code} 
                className="backdrop-blur-md bg-black/60 border border-white/5 rounded-lg p-2 text-center hover:bg-white/5 transition-colors"
              >
                <div
                  className={`w-6 h-6 mx-auto rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1 shadow-lg`}
                >
                  <stat.icon className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] font-medium text-white mb-1">{stat.code}</p>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-xs font-bold text-emerald-400">
                      {stat.attended}
                    </span>
                    <span className="text-[8px] text-gray-500">att</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-xs font-bold text-amber-400">
                      {stat.required}
                    </span>
                    <span className="text-[8px] text-gray-500">req</span>
                  </div>
                  {stat.riskStatus && (
                    <div className={`text-[9px] font-bold mt-0.5 ${riskColors[stat.riskStatus]}`}>
                      {stat.riskStatus === "SAFE" ? "✓ Safe" : stat.riskStatus === "WARNING" ? "! Attend" : "✗ Risk"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
