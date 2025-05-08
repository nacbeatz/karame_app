import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatabaseZap, Search, Edit, ShieldAlert, UploadCloud, DownloadCloud } from 'lucide-react';

function AttendanceAdmin() {
  // Placeholder for actual attendance log data and logic
  const attendanceLogs = [
    { id: "LOG001", employeeName: "John Doe", date: "2025-05-07", clockIn: "08:58", clockOut: "17:02", status: "Present", anomaly: "None" },
    { id: "LOG002", employeeName: "Jane Smith", date: "2025-05-07", clockIn: "09:15", clockOut: "17:00", status: "Late In", anomaly: "Late Clock-in" },
    { id: "LOG003", employeeName: "Mike Brown", date: "2025-05-06", clockIn: "08:00", clockOut: "16:30", status: "Early Out", anomaly: "Early Clock-out" },
    { id: "LOG004", employeeName: "Lisa White", date: "2025-05-06", clockIn: "-", clockOut: "-", status: "Absent", anomaly: "Missed Clock-in/out" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <DatabaseZap className="mr-3 h-8 w-8" /> Attendance Administration
          </h1>
          <p className="text-muted-foreground">
            Manage all attendance logs, review anomalies, and configure settings.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4" /> Bulk Import</Button>
            <Button variant="outline"><DownloadCloud className="mr-2 h-4 w-4" /> Export Data</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>View, search, and manage all employee attendance records.</CardDescription>
          <div className="pt-4 flex items-center space-x-2">
            <Input placeholder="Search logs (Name, ID, Date, Anomaly)..." className="max-w-sm" />
            <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Search Logs</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Anomaly</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell className="font-medium">{log.employeeName}</TableCell>
                  <TableCell>{log.date}</TableCell>
                  <TableCell>{log.clockIn}</TableCell>
                  <TableCell>{log.clockOut}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full 
                      ${log.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        log.status === 'Late In' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        log.status === 'Early Out' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                    `}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className={`${log.anomaly !== 'None' ? 'text-red-600 dark:text-red-400' : ''}`}>{log.anomaly}</TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-800">
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Device Configuration</CardTitle>
          <CardDescription>Manage DFACE702 device settings and synchronization (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent className="h-[150px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground ml-2">Device configuration interface will be here.</p>
        </CardContent>
      </Card>

    </div>
  );
}

export default AttendanceAdmin;

