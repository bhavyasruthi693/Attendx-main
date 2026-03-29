import { useEffect, useState } from "react";
import { Users, FileText, FlaskConical, BookPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentInfo } from "@/components/dashboard/StudentInfo";
import { SubjectsCard } from "@/components/dashboard/SubjectsCard";
import { AttendanceCalculator } from "@/components/dashboard/AttendanceCalculator";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AttendanceTable } from "@/components/dashboard/AttendanceTable";
import { LabsTable } from "@/components/dashboard/LabsTable";
import { AttendanceOverview } from "@/components/dashboard/AttendanceOverview";
import { MinimumAttendance } from "@/components/dashboard/MinimumAttendance";
import { validateAndRepairData, loadAttendanceFromBackend } from "@/lib/attendanceManager";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const Index = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Validate and repair attendance data
      const validation = validateAndRepairData();
      if (validation.repaired) {
        console.log("Attendance data was repaired");
      }

      // Pull latest attendance from backend
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        const sid = parsed.studentId || parsed.rollNo;
        if (sid) {
          await loadAttendanceFromBackend(sid);
        }
      }
      
      setLastRefresh(new Date());
      
      // Dispatch storage event to notify other components of data change
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial data load on mount
    refreshData();
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      {/* Overlay with 45% opacity for glassmorphism */}
      <div className="fixed inset-0 bg-background/45 z-0" />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white"></h1>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        
        {/* Top Section - Student Info + Subjects + Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-4">
            <StudentInfo />
          </div>
          <div className="lg:col-span-4">
            <SubjectsCard />
          </div>
          <div className="lg:col-span-4">
            <AttendanceCalculator />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Total classes"
            value="60"
            icon={Users}
            iconVariant="primary"
            valueColor="text-primary"
          />
          <StatsCard
            title="Total subjects"
            value="05"
            icon={FileText}
            iconVariant="info"
            valueColor="text-foreground"
          />
          <StatsCard
            title="Total labs"
            value="03"
            icon={FlaskConical}
            iconVariant="success"
            valueColor="text-foreground"
          />
          <StatsCard
            title="Additional Subjects"
            value="01"
            icon={BookPlus}
            iconVariant="warning"
            valueColor="text-foreground"
          />
        </div>

        {/* Attendance Table */}
        <div className="mb-6">
          <AttendanceTable />
        </div>

        {/* Labs Table */}
        <div className="mb-6">
          <LabsTable />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <AttendanceOverview />
          </div>
          <div className="lg:col-span-5">
            <MinimumAttendance />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
