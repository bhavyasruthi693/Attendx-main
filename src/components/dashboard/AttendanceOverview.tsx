import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useEffect, useState } from "react";
import { getStudentAttendance } from "@/lib/attendanceManager";

// Weeks definition (same date groups used in AdminPanel)
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

const TARGET_PERCENT = 75;

// Helper: compute weekly percentages from stored attendance
function computeWeeklyData(rollNo: string | null) {
  const out: { name: string; value: number; target: number }[] = [];
  if (!rollNo) return out;

  const studentData = getStudentAttendance(rollNo);

  for (let i = 0; i < WEEKS.length; i++) {
    const week = WEEKS[i];
    let total = 0;
    let present = 0;

    // Count every marked subject or lab within the week (partial weeks included)
    for (const date of week.dates) {
      const day = studentData[date] || {};
      for (const subject in day) {
        const status = day[subject];
        if (status === true || status === false) {
          total++;
          if (status === true) present++;
        }
      }
    }

    if (total === 0) continue;
    const pct = Math.round((present / total) * 100);
    out.push({ name: `W${i + 1}`, value: pct, target: TARGET_PERCENT });
  }

  return out;
}

const CustomDot = (props: any) => {
  const { cx, cy, value } = props;
  if (typeof value !== 'number') return null;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#06b6d4" stroke="#0a0a0a" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2} fill="white" />
    </g>
  );
};

export function AttendanceOverview() {
  const [weeklyData, setWeeklyData] = useState<{ name: string; value: number; target: number }[]>([]);
  const [studentRollNo, setStudentRollNo] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const s = JSON.parse(userData);
      setStudentRollNo(s.rollNo || null);
    }

    // update immediately and every 1s
    const update = () => setWeeklyData(computeWeeklyData(JSON.parse(localStorage.getItem("userData") || "null")?.rollNo || null));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const data = weeklyData;
  const entries = data.length;
  const currentAttendance = entries > 0 ? data[entries - 1].value : 0;
  const lastWeekAttendance = entries > 1 ? data[entries - 2].value : currentAttendance;
  const percentChange = lastWeekAttendance > 0 ? (((currentAttendance - lastWeekAttendance) / lastWeekAttendance) * 100).toFixed(1) : "0.0";
  const isPositive = currentAttendance >= lastWeekAttendance;

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 h-full shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            Attendance Overview
          </h3>
          <p className="text-sm flex items-center gap-2">
            <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{percentChange}%
            </span>
            <span className="text-gray-500">from last week</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-bold text-cyan-400">{currentAttendance}%</span>
          <span className="text-xs text-gray-500">Current</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attendanceGradientDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#0891b2" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0e7490" stopOpacity={0} />
              </linearGradient>
              <filter id="glowDark">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#4b5563", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#4b5563", fontSize: 10 }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <ReferenceLine 
              y={75} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ value: '75%', position: 'right', fill: '#f59e0b', fontSize: 9 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                color: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                fontSize: 11,
              }}
              formatter={(value: number) => [`${value}%`, "Attendance"]}
              labelFormatter={(label) => `Week ${label.replace('W', '')}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#attendanceGradientDark)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: "#06b6d4", stroke: "#0a0a0a", strokeWidth: 2 }}
              filter="url(#glowDark)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-gray-500">Attendance %</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
          <span className="text-gray-500">75% Target</span>
        </div>
      </div>
    </div>
  );
}
