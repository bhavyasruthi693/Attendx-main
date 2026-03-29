import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Lock, User, Shield, Clock, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadAttendanceFromBackend } from "@/lib/attendanceManager";
import { apiCall, APIError } from "@/lib/api-client";

const Login = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isAdminLogin) {
      // Admin login
      if (!adminPassword) {
        setError("Please enter admin password");
        setLoading(false);
        return;
      }

      // Simple admin password check (change "admin123" to your desired password)
      if (adminPassword !== "karthik2006@#") {
        setError("Invalid admin password");
        setLoading(false);
        return;
      }

      // Set a default admin user
      const adminData = {
        name: "Admin User",
        rollNo: "ADMIN001",
        className: "Admin",
        semester: "Admin",
        present: 0,
        absent: 0,
        isAdmin: true,
      };

      localStorage.setItem("userData", JSON.stringify(adminData));
      localStorage.setItem("isAdmin", "true");
      toast({
        title: "Success",
        description: "Welcome to Admin Panel!",
      });

      navigate("/admin");
    } else {
      // Student login
      if (!studentId || !password) {
        setError("Please enter both Student ID and Password");
        setLoading(false);
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        
        // Use retrying API client for production reliability
        const data = await apiCall(`${backendUrl}/login`, {
          method: "POST",
          body: JSON.stringify({
            student_id: studentId,
            password: password,
          }),
        });

        // Fire-and-forget attendance sync so login feels instant
        void loadAttendanceFromBackend(data.studentId || studentId).catch((loadErr) => {
          console.warn("Attendance sync on login failed", loadErr);
        });

        // Store user data in localStorage (keep rollNo and class info)
        localStorage.setItem("userData", JSON.stringify({ ...data, studentId }));

        toast({
          title: "Success",
          description: `Welcome back, ${data.name}!`,
        });

        navigate("/dashboard");
      } catch (err) {
        let errorMessage = "Failed to connect to server";
        
        if (err instanceof APIError) {
          if (err.statusCode === 401) {
            errorMessage = "Invalid credentials";
          } else if (err.statusCode >= 500 || err.statusCode === 0) {
            errorMessage = "Server error - please try again in a moment";
          } else {
            errorMessage = err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-black">
      {/* Centered AttendX Header with Glassmorphism - wider bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-16 py-2.5 shadow-2xl">
          <h1 className="text-2xl font-bold text-white tracking-wider drop-shadow-lg">
            Attend<span className="text-emerald-400">X</span>
          </h1>
        </div>
      </div>

      {/* Left side - Video Background */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.65)" }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
            type="video/mp4"
          />
        </video>
        
        {/* Welcome text overlay on video - positioned lower left */}
        <div className="absolute bottom-16 left-12 z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl">
            Welcome Back
          </h2>
          <p className="text-lg text-gray-300 drop-shadow-lg mb-6">
            Track your attendance seamlessly with AttendX
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-300/90">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm">Real-time attendance analytics</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300/90">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm">Never miss a class update</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300/90">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm">Secure & reliable platform</span>
            </div>
          </div>
        </div>
        
        {/* Seamless fade transition - ultra smooth */}
        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-black to-transparent"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-black p-8 pt-24 relative">
        
        {/* Ambient glow effect */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl"></div>

        {/* Glassmorphism Login Card - positioned lower */}
        <div className="w-full max-w-md relative z-10 mt-12">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Login Mode Toggle */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => {
                  setIsAdminLogin(false);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isAdminLogin
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/50"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Student
              </button>
              <button
                onClick={() => {
                  setIsAdminLogin(true);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAdminLogin
                    ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Admin
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {isAdminLogin ? "Admin Access" : "Student Login"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isAdminLogin ? "Manage attendance" : "Access your attendance dashboard"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-300 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {!isAdminLogin ? (
                <>
                  {/* Student ID Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Student ID</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="Enter your Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="h-12 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
                      />
                      <label className="text-sm text-gray-300 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                        Remember me
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Admin Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Admin Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="h-12 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>

                </>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-12 text-white rounded-xl font-semibold text-base shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAdminLogin
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/25 hover:shadow-purple-500/40"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                }`}
              >
                {loading ? "Logging in..." : isAdminLogin ? "Access Admin Panel" : "Login"}
              </Button>
            </form>

            {/* Footer text */}
            <p className="text-center text-gray-500 text-xs mt-6">
              By logging in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: Video as background overlay */}
      <div className="lg:hidden absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.3)" }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
            type="video/mp4"
          />
        </video>
      </div>
    </div>
  );
};

export default Login;
