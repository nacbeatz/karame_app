import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Link, Navigate, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, CalendarDays, Plane, User, Users, CheckCircle2, ClipboardList, BarChart3, Contact, Settings2, ShieldCheck, KeyRound, Settings as SettingsIcon, Blocks, LogOut, Menu, Sun, Moon, ChevronLeft, ChevronRight, ListChecks
} from "lucide-react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ComponentShowcase from "./ComponentShowcase.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import MySchedule from "./pages/MySchedule.jsx";
import MyLeave from "./pages/MyLeave.jsx";
import TeamSchedule from "./pages/TeamSchedule.jsx";
import LeaveApprovals from "./pages/LeaveApprovals.jsx";
import TeamAttendance from "./pages/TeamAttendance.jsx";
import Reports from "./pages/Reports.jsx";
import Employees from "./pages/Employees.jsx";
import LeaveConfiguration from "./pages/LeaveConfiguration.jsx";
import AttendanceAdmin from "./pages/AttendanceAdmin.jsx";
import Permissions from "./pages/Permissions.jsx";
import Settings from "./pages/Settings.jsx";
import MyAttendance from "./pages/MyAttendance.jsx";
import "./App.css";

// --- Authentication Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        setUser(decodedPayload.user || { username: "test", role: "User" }); // Fallback user
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("authToken");
        setToken(null);
        setUser({ username: "test", role: "User" }); // Fallback user on error
      }
    } else {
      setUser({ username: "test", role: "User" }); // Default user if no token
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const value = { token, user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// --- Theme Context ---
const ThemeContext = createContext(null);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// --- Protected Route Component ---
function RequireAuth({ children }) {
  let auth = useAuth();
  let location = useLocation();
  if (!auth.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// --- Navigation Links Configuration ---
const navLinkConfig = {
  common: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/my-schedule", label: "My Schedule", icon: CalendarDays },
    { path: "/my-leave", label: "My Leave", icon: Plane },
    { path: "/my-attendance", label: "My Attendance", icon: ListChecks },
    { path: "/profile", label: "My Profile", icon: User },
  ],
  leaderManager: [
    { path: "/team-schedule", label: "Team Schedule", icon: Users },
    { path: "/leave-approvals", label: "Leave Approvals", icon: CheckCircle2 },
    { path: "/team-attendance", label: "Team Attendance", icon: ClipboardList },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ],
  hrAdmin: [
    { path: "/employees", label: "Employees", icon: Contact },
    { path: "/leave-types", label: "Leave Config", icon: Settings2 },
    { path: "/attendance-admin", label: "Attendance Admin", icon: ShieldCheck },
  ],
  admin: [
    { path: "/roles-permissions", label: "Permissions", icon: KeyRound },
    { path: "/settings", label: "Settings", icon: SettingsIcon }, // Updated to use SettingsIcon
  ],
  development: [
    { path: "/showcase", label: "Component Showcase", icon: Blocks },
  ],
};

// --- Main Application Layout (Post-Login) ---
function MainLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(localStorage.getItem("sidebarCollapsed") === "true");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const getNavLinks = (role) => {
    let links = [...navLinkConfig.common];
    if (role === "TeamLeader" || role === "Manager" || role === "Admin") {
      links = [...links, ...navLinkConfig.leaderManager];
    }
    if (role === "HR" || role === "Admin") {
      links = [...links, ...navLinkConfig.hrAdmin];
    }
    if (role === "Admin") {
      links = [...links, ...navLinkConfig.admin];
    }
    links = [...links, ...navLinkConfig.development];
    return Array.from(new Map(links.map(item => [item.path, item])).values());
  };

  const navLinks = getNavLinks(auth.user?.role);

  const SidebarContent = ({ forceExpanded = false }) => {
    const displayAsCollapsed = !forceExpanded && isSidebarCollapsed;

    return (
      <TooltipProvider delayDuration={100}>
        <>
          <div className={`p-4 border-b flex items-center ${displayAsCollapsed ? "justify-center" : "justify-between"} border-gray-200 dark:border-gray-700`}>
            {!displayAsCollapsed && <h2 className="text-xl font-bold text-gray-800 dark:text-white">Hospital App</h2>}
            {!forceExpanded && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden lg:flex">
                {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            <nav className="px-2 py-2">
              {navLinks.map(link => {
                const navLinkContent = (
                  <>
                    <link.icon className={`h-5 w-5 ${!displayAsCollapsed ? "mr-3" : ""}`} />
                    {!displayAsCollapsed && <span>{link.label}</span>}
                  </>
                );

                return displayAsCollapsed ? (
                  <Tooltip key={link.path}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={link.path}
                        className={({ isActive }) =>
                          `flex items-center py-2.5 px-3 my-1 rounded-md transition-colors duration-200 
                          ${displayAsCollapsed ? "justify-center" : ""}
                          ${isActive
                            ? "bg-blue-500 text-white dark:bg-blue-600"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}`
                        }
                        onClick={() => isMobileNavOpen && setIsMobileNavOpen(false)}
                      >
                        {navLinkContent}
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="ml-2">
                      <p>{link.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 px-3 my-1 rounded-md transition-colors duration-200 
                      ${displayAsCollapsed ? "justify-center" : ""}
                      ${isActive
                        ? "bg-blue-500 text-white dark:bg-blue-600"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}`
                    }
                    onClick={() => isMobileNavOpen && setIsMobileNavOpen(false)}
                  >
                    {navLinkContent}
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${displayAsCollapsed ? "flex justify-center" : ""}`}>
            <Button onClick={handleLogout} variant="outline" className={`w-full ${displayAsCollapsed ? "px-0" : ""}`}>
              <LogOut className={`h-5 w-5 ${!displayAsCollapsed ? "mr-2" : ""}`} />
              {!displayAsCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col bg-white dark:bg-gray-800">
            <SidebarContent forceExpanded={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center z-10">
          <div className="lg:hidden">
            {/* Placeholder for mobile header content if needed, or keep it minimal */}
          </div>
          <div className="hidden lg:block">
            {/* Placeholder for breadcrumbs or page title */}
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={toggleTheme} variant="outline" size="icon">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <div className="text-sm">
              Logged in as: <span className="font-semibold">{auth.user?.username || "User"}</span> ({auth.user?.role || "N/A"})
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-schedule" element={<MySchedule />} />
            <Route path="/my-leave" element={<MyLeave />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/leave-types" element={<LeaveConfiguration />} />
            {(auth.user?.role === "TeamLeader" || auth.user?.role === "Manager" || auth.user?.role === "Admin" || auth.user?.role === "HR") && (
              <>
                <Route path="/team-schedule" element={<TeamSchedule />} />
                <Route path="/team-attendance" element={<TeamAttendance />} />
              </>
            )}
            {(auth.user?.role === "HR" || auth.user?.role === "Manager" || auth.user?.role === "Admin") && (
              <>
                <Route path="/leave-approvals" element={<LeaveApprovals />} />
                <Route path="/reports" element={<Reports />} />
              </>
            )}
            {(auth.user?.role === "HR" || auth.user?.role === "Admin") && (
              <>
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance-admin" element={<AttendanceAdmin />} />
              </>
            )}
            {(auth.user?.role === "Admin" || auth.user?.role === "HR") && (
              <>
                <Route path="/roles-permissions" element={<Permissions />} />
                <Route path="/settings" element={<Settings />} />
              </>
            )}
            <Route path="/showcase" element={<ComponentShowcase />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// --- App Component (Routing Logic) ---
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={<RequireAuth><MainLayout /></RequireAuth>}
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;