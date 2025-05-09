import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ListChecks, AlertTriangle, CalendarSearch } from 'lucide-react';

function TeamAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ onTime: 0, late: 0, absent: 0, onLeave: 0 });
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    fetch('/api/attendance?startDate=2025-02-01&endDate=2025-02-28&limit=1000')
      .then(res => res.json())
      .then(data => {
        // If backend returns { logs: [...] }
        const records = Array.isArray(data) ? data : data.logs;

        let onTime = 0, late = 0, absent = 0, onLeave = 0;

        records.forEach((record) => {
          if (record.type === "clock-in") {
            const hour = new Date(record.timestamp).getHours();
            if (hour <= 9) onTime++;
            else late++;
          }
          // Add logic for absent and onLeave if you have such records/types
          // Example: if (record.type === "absent") absent++;
          // Example: if (record.type === "leave") onLeave++;
        });

        setSummary({ onTime, late, absent, onLeave });
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ListChecks className="mr-3 h-8 w-8" /> Team Attendance
          </h1>
          <p className="text-muted-foreground">
            Monitor your team's real-time and historical attendance.
          </p>
        </div>
        <Button variant="outline">
          <CalendarSearch className="mr-2 h-4 w-4" /> View Full Log / Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>February 2025 Attendance Summary</CardTitle>
          <CardDescription>Overview of your team's attendance status for February 2025.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 bg-green-50 dark:bg-green-900/50">
              <CardTitle className="text-lg text-green-700 dark:text-green-300">On Time</CardTitle>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200">{summary.onTime}</p>
            </Card>
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/50">
              <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">Late</CardTitle>
              <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">{summary.late}</p>
            </Card>
            <Card className="p-4 bg-red-50 dark:bg-red-900/50">
              <CardTitle className="text-lg text-red-700 dark:text-red-300">Absent</CardTitle>
              <p className="text-3xl font-bold text-red-800 dark:text-red-200">{summary.absent}</p>
            </Card>
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/50">
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300">On Leave</CardTitle>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{summary.onLeave}</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" /> Recent Attendance Anomalies
          </CardTitle>
          <CardDescription>Flagged attendance issues requiring attention.</CardDescription>
        </CardHeader>
        <CardContent>
          {anomalies.length > 0 ? (
            <ul className="space-y-3">
              {anomalies.map((anomaly, idx) => (
                <li key={idx} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{anomaly.employeeName} - <span className="text-orange-600 dark:text-orange-400">{anomaly.type}</span></p>
                    <p className="text-sm text-muted-foreground">{anomaly.details} ({anomaly.time || anomaly.date})</p>
                  </div>
                  <Button variant="outline" size="sm">View Details / Action</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent anomalies flagged.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Clock-in/Out Status</CardTitle>
          <CardDescription>Live view of who is currently clocked in, out, or on break.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground ml-2">Live attendance status board will be displayed here.</p>
          {/* Placeholder for real-time status board */}
        </CardContent>
      </Card>

    </div>
  );
}

export default TeamAttendance;

