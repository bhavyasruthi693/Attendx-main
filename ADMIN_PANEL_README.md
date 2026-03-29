# Admin Panel - Attendance Management

## Overview
The Admin Panel allows administrators to update student attendance for each day and subject. When attendance is updated, it automatically reflects on the student's dashboard in real-time.

## Features

### How It Works
1. **Admin Access**: Only users with `isAdmin: true` flag can access the admin panel
2. **Student Selection**: Select a student to update their attendance
3. **Week & Date Selection**: Choose the week and then select individual dates
4. **Subject Management**: For each date, subjects scheduled for that day are displayed
5. **Attendance Marking**: Mark attendance as:
   - ✓ Present (Green check)
   - ✗ Absent (Red X)
   - Clear (No mark)

### Data Storage
- Attendance data is stored in localStorage under the key `attendanceData`
- Structure:
  ```
  {
    "rollNo": {
      "Jan 19": {
        "DBMS": true,
        "MP": false,
        ...
      },
      ...
    }
  }
  ```

## How to Access

### For Testing Admin Features
1. To enable admin access for a student, add this to your student data in localStorage:
   ```javascript
   {
     "name": "N.Thanmai Sri Harsha",
     "rollNo": "324506402408",
     "className": "CSE-6/A8",
     "semester": "2-2",
     "present": 41,
     "absent": 19,
     "isAdmin": true  // Add this line
   }
   ```

2. After updating the data, refresh the dashboard
3. You should see a Settings icon (⚙️) next to the Logout button
4. Click the Settings icon to access the Admin Panel
5. Or navigate directly to `/admin`

## Subject Schedule
The admin panel has predefined class schedules for each day:
- **Monday**: DBMS, MP
- **Tuesday**: DBMS, MP
- **Wednesday**: DBMS, DAA
- **Thursday**: DAA, FLAT
- **Friday**: MP, ME
- **Saturday**: No classes

## Workflow Example
1. Select "N.Thanmai Sri Harsha" from the student list
2. Click on "Week 1" to expand it
3. Click on "Jan 20 TUE" date row
4. For DBMS subject, click the checkmark to mark present
5. For MP subject, click the X to mark absent
6. The student's dashboard will immediately show these updates

## Files Created/Modified

### New Files
- **`src/lib/attendanceManager.ts`**: Utility functions for managing attendance data
- **`src/pages/AdminPanel.tsx`**: Admin panel component with full UI

### Modified Files
- **`src/App.tsx`**: Added `/admin` route
- **`src/components/dashboard/StudentInfo.tsx`**: Added admin button with Settings icon
- **`src/components/dashboard/AttendanceTable.tsx`**: Updated to read from attendance manager

## Notes
- No database changes were made; all data is stored in localStorage
- The attendance marks (✓ and ✗) will only show if the admin has set them
- Empty marks mean attendance hasn't been marked yet
- Previous component designs remain unchanged
