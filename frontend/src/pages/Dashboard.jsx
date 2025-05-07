import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Bell, BarChart, Users, CalendarCheck, AlertTriangle, Clock, CheckSquare, PlusCircle, ShieldCheck } from 'lucide-react'; // Ensure the Plane icon is imported correctly

// Placeholder for useAuth to get user role - replace with actual context if needed
const useAuth = () => {
  // In a real app, this would come from your AuthContext
  // For now, let's simulate a user for layout purposes
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return { user: decodedPayload.user };
    } catch (e) {
      return { user: { role: 'Employee', username: 'TestUser' } }; // Fallback
    }
  }
  return { user: { role: 'Employee', username: 'TestUser' } }; // Default if no token
};

function DashboardPage() {
  const { user } = useAuth(); // Get user role

  // Define KPIs based on role (example)
  const getKpisForRole = (role) => {
    const commonKpis = [
      { title: "My Upcoming Shift", value: "Tomorrow, 9 AM - Ward A", icon: <CalendarCheck className="h-6 w-6 text-blue-500" />, description: "Next scheduled work time." },
      { title: "My Leave Balance", value: "10 Days (Annual)", icon: <Plane className="h-6 w-6 text-green-500" />, description: "Remaining annual leave." },
    ];
    const managerKpis = [
      { title: "Team On-Shift", value: "12 Members", icon: <Users className="h-6 w-6 text-indigo-500" />, description: "Currently active team members." },
      { title: "Pending Approvals", value: "3 Requests", icon: <CheckSquare className="h-6 w-6 text-orange-500" />, description: "Leave/schedule changes awaiting action." },
      { title: "Attendance Compliance", value: "95%", icon: <BarChart className="h-6 w-6 text-purple-500" />, description: "Team attendance vs. scheduled." },
    ];
    const adminKpis = [
      { title: "Total Active Employees", value: "152", icon: <Users className="h-6 w-6 text-teal-500" />, description: "Current hospital staff count." },
      { title: "System Health", value: "Nominal", icon: <ShieldCheck className="h-6 w-6 text-cyan-500" />, description: "Overall system status." },
    ];

    let kpis = [...commonKpis];
    if (role === 'Manager' || role === 'TeamLeader') {
      kpis = [...kpis, ...managerKpis];
    }
    if (role === 'Admin' || role === 'HR') {
      kpis = [...kpis, ...managerKpis, ...adminKpis]; // HR sees the same KPIs as Admin
    }
    return kpis.slice(0, 4); // Limit to 4 for display
  };

  const kpis = getKpisForRole(user?.role);

  // Define Quick Actions based on role (example)
  const getQuickActionsForRole = (role) => {
    const commonActions = [
      { label: "Request Leave", icon: <Plane className="mr-2 h-4 w-4" />, action: () => console.log("Request Leave clicked") },
      { label: "View My Schedule", icon: <CalendarCheck className="mr-2 h-4 w-4" />, action: () => console.log("View My Schedule clicked") },
    ];
    const managerActions = [
      { label: "Approve Leave", icon: <CheckSquare className="mr-2 h-4 w-4" />, action: () => console.log("Approve Leave clicked") },
      { label: "Edit Team Schedule", icon: <Users className="mr-2 h-4 w-4" />, action: () => console.log("Edit Team Schedule clicked") },
    ];
    const adminActions = [
      { label: "Add New Employee", icon: <PlusCircle className="mr-2 h-4 w-4" />, action: () => console.log("Add New Employee clicked") },
      { label: "Generate Report", icon: <BarChart className="mr-2 h-4 w-4" />, action: () => console.log("Generate Report clicked") },
    ];

    let actions = [...commonActions];
    if (role === 'Manager' || role === 'TeamLeader') {
      actions = [...actions, ...managerActions];
    }
    if (role === 'Admin' || role === 'HR') {
      actions = [...actions, ...managerActions, ...adminActions]; // HR sees the same actions as Admin
    }
    return actions.slice(0, 4); // Limit to 4 for display
  };

  const quickActions = getQuickActionsForRole(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.username || "User"}! Here's an overview of your workspace.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Placeholder for global actions like "Create New" or Date Range Picker */}
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Other Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Placeholder for team attendance chart (Line Chart).</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[350px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
            <BarChart className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground ml-2">Chart Area</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button key={index} variant="outline" className="w-full justify-start" onClick={action.action}>
                {action.icon} {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Notifications & Alerts</CardTitle>
            <CardDescription>Recent updates and important alerts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto space-y-4">
            {/* Placeholder Notifications */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-background rounded-lg border">
                <Bell className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Leave Request: John Doe</p>
                  <p className="text-xs text-muted-foreground">Sick leave requested for 3 days. {(i + 1) * 2} hours ago.</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs">View Details</Button>
                </div>
              </div>
            ))}
            <div className="flex items-start space-x-3 p-3 bg-background rounded-lg border border-yellow-500/50">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <p className="text-sm font-medium">Late Clock-in: Jane Smith</p>
                <p className="text-xs text-muted-foreground">Clocked in 15 mins late for morning shift. 30 mins ago.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Team Performance / "Best Work of the Day"</CardTitle>
            <CardDescription>Placeholder for team metrics or specific recognitions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
            <Clock className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground ml-2">Performance Metrics Area</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

export default DashboardPage;

