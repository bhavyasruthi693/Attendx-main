import { Check, X, ChevronDown, ChevronRight, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { getDateAttendance } from "@/lib/attendanceManager";

interface AttendanceRow {
  date: string;
  isWeekHeader?: boolean;
  dbms?: boolean | null | "both";
  daa?: boolean | null | "both";
  mp?: boolean | null | "both";
  flat?: boolean | null | "both";
  me?: boolean | null | "both";
}

const attendanceData: AttendanceRow[] = [
  // Week 1: Jan 19-24 - MON: ME, TUE: DBMS+MP, WED: DAA, THU: DAA+DBMS, FRI: ME+MP, SAT: FLAT
  { date: "Week 1", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Jan 19 MON", dbms: null, daa: null, mp: null, flat: null, me: null },
  { date: "Jan 20 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Jan 21 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Jan 22 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Jan 23 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Jan 24 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 2: Jan 26-31
  { date: "Week 2", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Jan 26 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Jan 27 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Jan 28 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Jan 29 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Jan 30 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Jan 31 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 3: Feb 2-7
  { date: "Week 3", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Feb 02 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Feb 03 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Feb 04 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 05 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 06 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Feb 07 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 4: Feb 9-14
  { date: "Week 4", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Feb 09 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Feb 10 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Feb 11 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 12 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 13 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Feb 14 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 5: Feb 16-21
  { date: "Week 5", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Feb 16 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Feb 17 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Feb 18 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 19 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 20 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Feb 21 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 6: Feb 23-28
  { date: "Week 6", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Feb 23 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Feb 24 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Feb 25 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 26 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Feb 27 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Feb 28 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 7: Mar 2-7
  { date: "Week 7", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Mar 02 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Mar 03 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Mar 04 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 05 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 06 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Mar 07 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 8: Mar 9-14
  { date: "Week 8", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Mar 09 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Mar 10 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Mar 11 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 12 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 13 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Mar 14 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 9: Mar 16-21
  { date: "Week 9", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Mar 16 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Mar 17 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Mar 18 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 19 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 20 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Mar 21 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 10: Mar 23-28
  { date: "Week 10", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Mar 23 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Mar 24 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Mar 25 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 26 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Mar 27 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Mar 28 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 11: Mar 30 - Apr 4
  { date: "Week 11", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Mar 30 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Mar 31 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Apr 01 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 02 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 03 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Apr 04 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 12: Apr 6-11
  { date: "Week 12", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Apr 06 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Apr 07 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Apr 08 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 09 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 10 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Apr 11 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
  // Week 13: Apr 13-18
  { date: "Week 13", isWeekHeader: true, dbms: true, daa: false, mp: "both", flat: true, me: false },
  { date: "Apr 13 MON", dbms: null, daa: null, mp: null, flat: null, me: true },
  { date: "Apr 14 TUE", dbms: true, daa: null, mp: true, flat: null, me: null },
  { date: "Apr 15 WED", dbms: null, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 16 THUR", dbms: true, daa: true, mp: null, flat: null, me: null },
  { date: "Apr 17 FRI", dbms: null, daa: null, mp: true, flat: null, me: true },
  { date: "Apr 18 SAT", dbms: null, daa: null, mp: null, flat: true, me: null },
];

const StatusIcon = ({ status }: { status: boolean | null | undefined | "both" }) => {
  if (status === "both") {
    return (
      <div className="flex items-center justify-center gap-1">
        <Check className="w-4 h-4 text-primary" />
        <X className="w-4 h-4 text-destructive" />
      </div>
    );
  }
  if (status === true) return <Check className="w-4 h-4 text-primary" />;
  if (status === false) return <X className="w-4 h-4 text-destructive" />;
  return null;
};

const DATE_TO_SIMPLE: { [key: string]: string } = {
  "Jan 19 MON": "Jan 19",
  "Jan 20 TUE": "Jan 20",
  "Jan 21 WED": "Jan 21",
  "Jan 22 THUR": "Jan 22",
  "Jan 23 FRI": "Jan 23",
  "Jan 24 SAT": "Jan 24",
  "Jan 26 MON": "Jan 26",
  "Jan 27 TUE": "Jan 27",
  "Jan 28 WED": "Jan 28",
  "Jan 29 THUR": "Jan 29",
  "Jan 30 FRI": "Jan 30",
  "Jan 31 SAT": "Jan 31",
  "Feb 02 MON": "Feb 02",
  "Feb 03 TUE": "Feb 03",
  "Feb 04 WED": "Feb 04",
  "Feb 05 THUR": "Feb 05",
  "Feb 06 FRI": "Feb 06",
  "Feb 07 SAT": "Feb 07",
  "Feb 09 MON": "Feb 09",
  "Feb 10 TUE": "Feb 10",
  "Feb 11 WED": "Feb 11",
  "Feb 12 THUR": "Feb 12",
  "Feb 13 FRI": "Feb 13",
  "Feb 14 SAT": "Feb 14",
  "Feb 16 MON": "Feb 16",
  "Feb 17 TUE": "Feb 17",
  "Feb 18 WED": "Feb 18",
  "Feb 19 THUR": "Feb 19",
  "Feb 20 FRI": "Feb 20",
  "Feb 21 SAT": "Feb 21",
  "Feb 23 MON": "Feb 23",
  "Feb 24 TUE": "Feb 24",
  "Feb 25 WED": "Feb 25",
  "Feb 26 THUR": "Feb 26",
  "Feb 27 FRI": "Feb 27",
  "Feb 28 SAT": "Feb 28",
  "Mar 02 MON": "Mar 02",
  "Mar 03 TUE": "Mar 03",
  "Mar 04 WED": "Mar 04",
  "Mar 05 THUR": "Mar 05",
  "Mar 06 FRI": "Mar 06",
  "Mar 07 SAT": "Mar 07",
  "Mar 09 MON": "Mar 09",
  "Mar 10 TUE": "Mar 10",
  "Mar 11 WED": "Mar 11",
  "Mar 12 THUR": "Mar 12",
  "Mar 13 FRI": "Mar 13",
  "Mar 14 SAT": "Mar 14",
  "Mar 16 MON": "Mar 16",
  "Mar 17 TUE": "Mar 17",
  "Mar 18 WED": "Mar 18",
  "Mar 19 THUR": "Mar 19",
  "Mar 20 FRI": "Mar 20",
  "Mar 21 SAT": "Mar 21",
  "Mar 23 MON": "Mar 23",
  "Mar 24 TUE": "Mar 24",
  "Mar 25 WED": "Mar 25",
  "Mar 26 THUR": "Mar 26",
  "Mar 27 FRI": "Mar 27",
  "Mar 28 SAT": "Mar 28",
  "Mar 30 MON": "Mar 30",
  "Mar 31 TUE": "Mar 31",
  "Apr 01 WED": "Apr 01",
  "Apr 02 THUR": "Apr 02",
  "Apr 03 FRI": "Apr 03",
  "Apr 04 SAT": "Apr 04",
  "Apr 06 MON": "Apr 06",
  "Apr 07 TUE": "Apr 07",
  "Apr 08 WED": "Apr 08",
  "Apr 09 THUR": "Apr 09",
  "Apr 10 FRI": "Apr 10",
  "Apr 11 SAT": "Apr 11",
  "Apr 13 MON": "Apr 13",
  "Apr 14 TUE": "Apr 14",
  "Apr 15 WED": "Apr 15",
  "Apr 16 THUR": "Apr 16",
  "Apr 17 FRI": "Apr 17",
  "Apr 18 SAT": "Apr 18",
};

export function AttendanceTable() {
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

  const subjects = ["DBMS", "DAA", "MP", "FLAT", "ME"];

  const getAttendanceForDate = (dateWithDay: string, subject: string): boolean | null => {
    const simpleDate = DATE_TO_SIMPLE[dateWithDay];
    if (!simpleDate || !studentRollNo) return null;
    const dateAttendance = getDateAttendance(studentRollNo, simpleDate);
    return dateAttendance[subject] ?? null;
  };

  // Get week summary by aggregating all dates in the week
  const getWeekSummary = (weekName: string, subject: string): boolean | null | "both" => {
    const weekRowIndex = attendanceData.findIndex((row) => row.isWeekHeader && row.date === weekName);
    if (weekRowIndex === -1) return null;

    // Get all dates for this week (next 6 rows)
    const weekDates = [];
    for (let i = weekRowIndex + 1; i < attendanceData.length && weekDates.length < 6; i++) {
      if (attendanceData[i].isWeekHeader) break;
      weekDates.push(attendanceData[i].date);
    }

    // Collect attendance marks for this subject across all dates in the week
    const marks: (boolean | null)[] = [];
    weekDates.forEach((dateWithDay) => {
      const mark = getAttendanceForDate(dateWithDay, subject);
      if (mark !== null) {
        marks.push(mark);
      }
    });

    // If no marks found, return null
    if (marks.length === 0) return null;

    // If all marks are the same, return that mark
    if (marks.every((m) => m === true)) return true;
    if (marks.every((m) => m === false)) return false;

    // If mixed marks, return "both"
    return "both";
  };

  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Subject Attendance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                Week
              </th>
              {subjects.map((subject) => (
                <th
                  key={subject}
                  className="text-center py-3 px-4 text-sm font-semibold text-white"
                >
                  {subject}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((row, index) => {
              if (row.isWeekHeader) {
                const isExpanded = expandedWeeks.includes(row.date);
                return (
                  <tr
                    key={index}
                    className="border-b border-white/10 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleWeek(row.date)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-white flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {row.date}
                      {row.date === "Week 4" && (
                        <Mail className="w-4 h-4 text-muted-foreground ml-2" />
                      )}
                    </td>
                    {subjects.map((subject) => (
                      <td key={subject} className="text-center py-3 px-4">
                        <div className="flex justify-center">
                          <StatusIcon status={getWeekSummary(row.date, subject)} />
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              }

              // Check if this row belongs to an expanded week
              const weekNumber = Math.floor((index - 1) / 7) + 1;
              const weekName = `Week ${weekNumber}`;
              if (!expandedWeeks.includes(weekName)) {
                return null;
              }

              return (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-2 px-4 pl-10 text-xs text-gray-400">
                    {row.date}
                  </td>
                  {subjects.map((subject) => (
                    <td key={subject} className="text-center py-2 px-4">
                      <div className="flex justify-center">
                        <StatusIcon status={getAttendanceForDate(row.date, subject)} />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
