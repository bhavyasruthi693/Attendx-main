import { Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getDateAttendance } from "@/lib/attendanceManager";

interface LabAttendanceRow {
  date: string;
  isWeekHeader?: boolean;
  alc?: boolean | null;
  dbms?: boolean | null;
  wt?: boolean | null;
}

// Lab weeks data for 13 weeks (Mon, Tue, Wed only)
const LAB_WEEKS_DATA = [
  {
    name: "Week 1",
    dates: ["Jan 19", "Jan 20", "Jan 21"],
  },
  {
    name: "Week 2",
    dates: ["Jan 26", "Jan 27", "Jan 28"],
  },
  {
    name: "Week 3",
    dates: ["Feb 02", "Feb 03", "Feb 04"],
  },
  {
    name: "Week 4",
    dates: ["Feb 09", "Feb 10", "Feb 11"],
  },
  {
    name: "Week 5",
    dates: ["Feb 16", "Feb 17", "Feb 18"],
  },
  {
    name: "Week 6",
    dates: ["Feb 23", "Feb 24", "Feb 25"],
  },
  {
    name: "Week 7",
    dates: ["Mar 02", "Mar 03", "Mar 04"],
  },
  {
    name: "Week 8",
    dates: ["Mar 09", "Mar 10", "Mar 11"],
  },
  {
    name: "Week 9",
    dates: ["Mar 16", "Mar 17", "Mar 18"],
  },
  {
    name: "Week 10",
    dates: ["Mar 23", "Mar 24", "Mar 25"],
  },
  {
    name: "Week 11",
    dates: ["Mar 30", "Mar 31", "Apr 01"],
  },
  {
    name: "Week 12",
    dates: ["Apr 06", "Apr 07", "Apr 08"],
  },
  {
    name: "Week 13",
    dates: ["Apr 13", "Apr 14", "Apr 15"],
  },
];

// Lab mapping - DBMS/ALC on Monday, WT/DBMS on Tuesday, WT/ALC on Wednesday
const LAB_DATE_MAPPING: { [key: string]: string } = {
  "Jan 19": "DBMS/ALC",
  "Jan 20": "WT/DBMS",
  "Jan 21": "WT/ALC",
  "Jan 26": "DBMS/ALC",
  "Jan 27": "WT/DBMS",
  "Jan 28": "WT/ALC",
  "Feb 02": "DBMS/ALC",
  "Feb 03": "WT/DBMS",
  "Feb 04": "WT/ALC",
  "Feb 09": "DBMS/ALC",
  "Feb 10": "WT/DBMS",
  "Feb 11": "WT/ALC",
  "Feb 16": "DBMS/ALC",
  "Feb 17": "WT/DBMS",
  "Feb 18": "WT/ALC",
  "Feb 23": "DBMS/ALC",
  "Feb 24": "WT/DBMS",
  "Feb 25": "WT/ALC",
  "Mar 02": "DBMS/ALC",
  "Mar 03": "WT/DBMS",
  "Mar 04": "WT/ALC",
  "Mar 09": "DBMS/ALC",
  "Mar 10": "WT/DBMS",
  "Mar 11": "WT/ALC",
  "Mar 16": "DBMS/ALC",
  "Mar 17": "WT/DBMS",
  "Mar 18": "WT/ALC",
  "Mar 23": "DBMS/ALC",
  "Mar 24": "WT/DBMS",
  "Mar 25": "WT/ALC",
  "Mar 30": "DBMS/ALC",
  "Mar 31": "WT/DBMS",
  "Apr 01": "WT/ALC",
  "Apr 06": "DBMS/ALC",
  "Apr 07": "WT/DBMS",
  "Apr 08": "WT/ALC",
  "Apr 13": "DBMS/ALC",
  "Apr 14": "WT/DBMS",
  "Apr 15": "WT/ALC",
};

// Day names for display
const DAY_NAMES: { [key: string]: string } = {
  "Jan 19": "MON",
  "Jan 20": "TUE",
  "Jan 21": "WED",
  "Jan 26": "MON",
  "Jan 27": "TUE",
  "Jan 28": "WED",
  "Feb 02": "MON",
  "Feb 03": "TUE",
  "Feb 04": "WED",
  "Feb 09": "MON",
  "Feb 10": "TUE",
  "Feb 11": "WED",
  "Feb 16": "MON",
  "Feb 17": "TUE",
  "Feb 18": "WED",
  "Feb 23": "MON",
  "Feb 24": "TUE",
  "Feb 25": "WED",
  "Mar 02": "MON",
  "Mar 03": "TUE",
  "Mar 04": "WED",
  "Mar 09": "MON",
  "Mar 10": "TUE",
  "Mar 11": "WED",
  "Mar 16": "MON",
  "Mar 17": "TUE",
  "Mar 18": "WED",
  "Mar 23": "MON",
  "Mar 24": "TUE",
  "Mar 25": "WED",
  "Mar 30": "MON",
  "Mar 31": "TUE",
  "Apr 01": "WED",
  "Apr 06": "MON",
  "Apr 07": "TUE",
  "Apr 08": "WED",
  "Apr 13": "MON",
  "Apr 14": "TUE",
  "Apr 15": "WED",
};

const StatusIcon = ({ status }: { status: boolean | null | undefined }) => {
  if (status === true) return <Check className="w-4 h-4 text-primary" />;
  if (status === false) return <X className="w-4 h-4 text-destructive" />;
  return null;
};

export function LabsTable() {
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(["Week 1"]);
  const [studentRollNo, setStudentRollNo] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const student = JSON.parse(userData);
      setStudentRollNo(student.rollNo);
    }
  }, []);

  // Listen for storage changes (from admin panel or other sources)
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleWeek = (week: string) => {
    setExpandedWeeks((prev) =>
      prev.includes(week)
        ? prev.filter((w) => w !== week)
        : [...prev, week]
    );
  };

  const labs = [
    { key: "DBMS/ALC", label: "DBMS/ALC" },
    { key: "WT/DBMS", label: "WT/DBMS" },
    { key: "WT/ALC", label: "WT/ALC" },
  ];

  const getLabAttendanceForDate = (date: string, labKey: string): boolean | null => {
    if (!studentRollNo) return null;
    const dateAttendance = getDateAttendance(studentRollNo, date);
    return dateAttendance[labKey] ?? null;
  };

  // Get week summary by aggregating all labs in the week
  const getWeekSummary = (weekName: string, labKey: string): boolean | null => {
    const weekData = LAB_WEEKS_DATA.find((w) => w.name === weekName);
    if (!weekData) return null;

    // Collect attendance marks for this lab across all dates in the week
    const marks: (boolean | null)[] = [];
    weekData.dates.forEach((date) => {
      const mark = getLabAttendanceForDate(date, labKey);
      if (mark !== null) {
        marks.push(mark);
      }
    });

    // If no marks found, return null
    if (marks.length === 0) return null;

    // If all marks are the same, return that mark
    if (marks.every((m) => m === true)) return true;
    if (marks.every((m) => m === false)) return false;

    // If mixed marks, return false (representing partial attendance)
    return false;
  };

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Lab Attendance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                Week
              </th>
              {labs.map((lab) => (
                <th
                  key={lab.key}
                  className="text-center py-3 px-4 text-sm font-semibold text-white"
                >
                  {lab.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAB_WEEKS_DATA.map((week, weekIndex) => (
              <>
                <tr
                  key={`${week.name}-header`}
                  className="border-b border-white/10 cursor-pointer hover:bg-white/5"
                  onClick={() => toggleWeek(week.name)}
                >
                  <td className="py-3 px-4 text-sm font-medium text-white flex items-center gap-2">
                    {expandedWeeks.includes(week.name) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    {week.name}
                  </td>
                  {labs.map((lab) => (
                    <td key={lab.key} className="text-center py-3 px-4">
                      <div className="flex justify-center">
                        <StatusIcon status={getWeekSummary(week.name, lab.key)} />
                      </div>
                    </td>
                  ))}
                </tr>

                {expandedWeeks.includes(week.name) &&
                  week.dates.map((date, dateIndex) => (
                    <tr key={`${week.name}-${dateIndex}`} className="border-b border-white/5">
                      <td className="py-2 px-4 pl-10 text-xs text-gray-400">
                        {date} {DAY_NAMES[date] || ""}
                      </td>
                      {labs.map((lab) => {
                        const labForDate = LAB_DATE_MAPPING[date];
                        return (
                          <td key={lab.key} className="text-center py-2 px-4">
                            <div className="flex justify-center">
                              {labForDate === lab.key ? (
                                <StatusIcon status={getLabAttendanceForDate(date, lab.key)} />
                              ) : (
                                <span className="text-xs text-gray-600">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
