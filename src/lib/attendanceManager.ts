
// Attendance data management utility with Backend Sync

export interface SubjectAttendance {
  [subject: string]: boolean | null; // true = present, false = absent, null = not marked
}

export interface DateAttendance {
  [date: string]: SubjectAttendance;
}

export interface StudentAttendance {
  [rollNo: string]: DateAttendance;
}

const ATTENDANCE_STORAGE_KEY = "attendanceData";
const ATTENDANCE_BACKUP_KEY = "attendanceData_backup";
const LAST_SYNC_KEY = "attendanceData_lastSync";

// Get backend API URL
function getBackendUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

// Convert ISO date (YYYY-MM-DD) to short format (Mon DD like "Jan 19")
function convertISODateToShort(isoDate: string): string {
  try {
    // Parse ISO date format YYYY-MM-DD
    const [year, month, day] = isoDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    
    const monthAbbr = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayStr = String(day).padStart(2, '0');
    
    return `${monthAbbr} ${dayStr}`;
  } catch (error) {
    console.error("Error converting date:", isoDate, error);
    return isoDate;
  }
}

// Get all attendance data from localStorage
export function getAllAttendanceData(): StudentAttendance {
  try {
    const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading attendance data:", error);
    // Try to recover from backup
    const backup = localStorage.getItem(ATTENDANCE_BACKUP_KEY);
    if (backup) {
      console.log("Recovering from backup...");
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, backup);
      return JSON.parse(backup);
    }
    return {};
  }
}

// Get attendance for a specific student
export function getStudentAttendance(rollNo: string): DateAttendance {
  const allData = getAllAttendanceData();
  // Try rollNo key first; if empty, fall back to any matching studentId key
  if (allData[rollNo]) return allData[rollNo];

  // Fallback: some code paths store under studentId; attempt to find a matching key
  const alt = Object.keys(allData).find((k) => k === rollNo);
  if (alt && allData[alt]) return allData[alt];

  return {};
}

// Update attendance for a specific student, date, and subject (local + backend)
export function updateAttendance(
  rollNo: string,
  date: string,
  subject: string,
  status: boolean | null
): boolean {
  try {
    const allData = getAllAttendanceData();

    // Create backup before updating
    const backupData = JSON.stringify(allData);
    localStorage.setItem(ATTENDANCE_BACKUP_KEY, backupData);

    if (!allData[rollNo]) {
      allData[rollNo] = {};
    }

    if (!allData[rollNo][date]) {
      allData[rollNo][date] = {};
    }

    allData[rollNo][date][subject] = status;

    // Save to localStorage
    const dataToSave = JSON.stringify(allData);
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, dataToSave);
    
    // Update last sync timestamp
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    // Verify save was successful
    const savedData = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!savedData) {
      throw new Error("Failed to save attendance data");
    }

    const savedParsed = JSON.parse(savedData);
    const savedValue = savedParsed[rollNo]?.[date]?.[subject];
    
    if (savedValue !== status) {
      throw new Error("Data mismatch after save");
    }

    return true;
  } catch (error) {
    console.error("Error updating attendance:", error);
    return false;
  }
}

// Sync attendance update to backend (called after updateAttendance)
export async function syncAttendanceToBackend(
  studentId: string,
  date: string,
  subject: string,
  status: boolean | null
): Promise<boolean> {
  try {
    const backendUrl = getBackendUrl();
    
    // Use dynamic import to avoid circular dependency
    const { fetchWithRetry } = await import('./api-client');
    
    // Convert short date format (Mon DD) to ISO format (YYYY-MM-DD) for backend
    const isoDate = convertShortDateToISO(date);
    
    const response = await fetchWithRetry(`${backendUrl}/attendance/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        date: isoDate,
        subject: subject,
        status: status,
      }),
    });

    if (!response.ok) {
      console.error("Failed to sync attendance to backend:", response.statusText);
      return false;
    }

    console.log("Attendance synced to backend successfully");
    return true;
  } catch (error) {
    console.error("Error syncing attendance to backend:", error);
    return false;
  }
}

// Convert short date format (Mon DD like "Jan 19") to ISO format (YYYY-MM-DD)
function convertShortDateToISO(shortDate: string): string {
  try {
    // Parse "Mon DD" format like "Jan 19"
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Try to parse the date
    const dateObj = new Date(`${shortDate} ${currentYear}`);
    
    if (isNaN(dateObj.getTime())) {
      console.warn("Could not parse date:", shortDate);
      return shortDate;
    }
    
    // Format as ISO date (YYYY-MM-DD)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error converting short date to ISO:", shortDate, error);
    return shortDate;
  }
}

// Load attendance from backend (when student logs in)
export async function loadAttendanceFromBackend(studentId: string): Promise<DateAttendance> {
  try {
    const backendUrl = getBackendUrl();
    
    // Use dynamic import to avoid circular dependency with api-client
    const { fetchWithRetry } = await import('./api-client');
    
    const response = await fetchWithRetry(`${backendUrl}/attendance/${studentId}`);

    if (!response.ok) {
      console.error("Failed to load attendance from backend");
      return {};
    }

    const data = await response.json();
    const backendAttendance = data.attendance || {};

    // Convert ISO dates (YYYY-MM-DD) to short format (Mon DD)
    const convertedAttendance: DateAttendance = {};
    for (const dateKey in backendAttendance) {
      // Convert YYYY-MM-DD to "Mon DD" format
      const shortDate = convertISODateToShort(dateKey);
      convertedAttendance[shortDate] = backendAttendance[dateKey];
    }

    // Store under both studentId and rollNo to keep dashboards consistent across devices
    const allData = getAllAttendanceData();
    const rollKey = data.rollNo || studentId;
    allData[studentId] = convertedAttendance;
    allData[rollKey] = convertedAttendance;
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(allData));

    return convertedAttendance;
  } catch (error) {
    console.error("Error loading attendance from backend:", error);
    return {};
  }
}

// Sync all local attendance to backend (batch sync)
export async function syncAllAttendanceToBackend(studentId: string): Promise<boolean> {
  try {
    const backendUrl = getBackendUrl();
    
    // Use dynamic import to avoid circular dependency
    const { fetchWithRetry } = await import('./api-client');
    
    const allData = getAllAttendanceData();
    const attendance = allData[studentId] || {};

    // Convert short date format keys to ISO format for backend
    const convertedAttendance: { [key: string]: SubjectAttendance } = {};
    for (const shortDate in attendance) {
      const isoDate = convertShortDateToISO(shortDate);
      convertedAttendance[isoDate] = attendance[shortDate];
    }

    const response = await fetchWithRetry(`${backendUrl}/attendance/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        attendance: convertedAttendance,
      }),
    });

    if (!response.ok) {
      console.error("Failed to sync all attendance to backend");
      return false;
    }

    console.log("All attendance synced to backend successfully");
    return true;
  } catch (error) {
    console.error("Error syncing all attendance to backend:", error);
    return false;
  }
}

// Get attendance for a specific date
export function getDateAttendance(rollNo: string, date: string): SubjectAttendance {
  const studentData = getStudentAttendance(rollNo);
  return studentData[date] || {};
}

// Clear all attendance data (for testing)
export function clearAllAttendanceData(): void {
  try {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(ATTENDANCE_BACKUP_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error("Error clearing attendance data:", error);
  }
}

// Get list of all students in the system
export function getAllStudents(): string[] {
  const allData = getAllAttendanceData();
  return Object.keys(allData);
}

// Force refresh and validate data integrity
export function validateAndRepairData(): { valid: boolean; repaired: boolean } {
  try {
    const data = getAllAttendanceData();
    let repaired = false;

    // Check if data structure is valid
    for (const rollNo in data) {
      if (typeof data[rollNo] !== "object") {
        delete data[rollNo];
        repaired = true;
        continue;
      }

      for (const date in data[rollNo]) {
        if (typeof data[rollNo][date] !== "object") {
          delete data[rollNo][date];
          repaired = true;
          continue;
        }

        for (const subject in data[rollNo][date]) {
          const value = data[rollNo][date][subject];
          if (value !== true && value !== false && value !== null) {
            delete data[rollNo][date][subject];
            repaired = true;
          }
        }
      }
    }

    if (repaired) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(data));
    }

    return { valid: true, repaired };
  } catch (error) {
    console.error("Error validating data:", error);
    return { valid: false, repaired: false };
  }
}

// Calculate attendance statistics for a student
export interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export function calculateAttendanceStats(rollNo: string): AttendanceStats {
  const studentData = getStudentAttendance(rollNo);
  
  let totalClasses = 0;
  let presentCount = 0;
  let absentCount = 0;

  // Iterate through all dates
  for (const date in studentData) {
    const dayAttendance = studentData[date];
    
    // Iterate through all subjects/labs for this date
    for (const subject in dayAttendance) {
      const status = dayAttendance[subject];
      
      // Only count if it's marked (not null)
      if (status !== null) {
        totalClasses++;
        if (status === true) {
          presentCount++;
        } else if (status === false) {
          absentCount++;
        }
      }
    }
  }

  const attendancePercentage = totalClasses > 0 
    ? Math.round((presentCount / totalClasses) * 100) 
    : 0;

  return {
    totalClasses,
    presentCount,
    absentCount,
    attendancePercentage,
  };
}

// Get subject attendance stats (only subjects)
export function calculateSubjectAttendanceStats(rollNo: string): AttendanceStats {
  const studentData = getStudentAttendance(rollNo);
  const subjects = ["DBMS", "DAA", "MP", "FLAT", "ME"];
  
  let totalClasses = 0;
  let presentCount = 0;
  let absentCount = 0;

  // Iterate through all dates
  for (const date in studentData) {
    const dayAttendance = studentData[date];
    
    // Only count subjects
    for (const subject of subjects) {
      const status = dayAttendance[subject];
      
      if (status !== null) {
        totalClasses++;
        if (status === true) {
          presentCount++;
        } else if (status === false) {
          absentCount++;
        }
      }
    }
  }

  const attendancePercentage = totalClasses > 0 
    ? Math.round((presentCount / totalClasses) * 100) 
    : 0;

  return {
    totalClasses,
    presentCount,
    absentCount,
    attendancePercentage,
  };
}

// Get lab attendance stats (only labs)
export function calculateLabAttendanceStats(rollNo: string): AttendanceStats {
  const studentData = getStudentAttendance(rollNo);
  const labs = ["DBMS/ALC", "WT/DBMS", "WT/ALC"];
  
  let totalClasses = 0;
  let presentCount = 0;
  let absentCount = 0;

  // Iterate through all dates
  for (const date in studentData) {
    const dayAttendance = studentData[date];
    
    // Only count labs
    for (const lab of labs) {
      const status = dayAttendance[lab];
      
      if (status !== null) {
        totalClasses++;
        if (status === true) {
          presentCount++;
        } else if (status === false) {
          absentCount++;
        }
      }
    }
  }

  const attendancePercentage = totalClasses > 0 
    ? Math.round((presentCount / totalClasses) * 100) 
    : 0;

  return {
    totalClasses,
    presentCount,
    absentCount,
    attendancePercentage,
  };
}

