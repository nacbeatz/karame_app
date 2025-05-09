import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, CalendarSearch } from 'lucide-react';

function MyAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState({ onTime: 0, late: 0, absent: 0, onLeave: 0 });

    useEffect(() => {
        // Fetch only the logged-in user's attendance for the current month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`)
            .then(res => res.json())
            .then(data => {
                const records = Array.isArray(data) ? data : data.logs;
                let onTime = 0, late = 0, absent = 0, onLeave = 0;
                records.forEach((record) => {
                    if (record.type === "clock-in") {
                        const hour = new Date(record.timestamp).getHours();
                        if (hour <= 9) onTime++;
                        else late++;
                    }
                    // Add logic for absent and onLeave if you have such records/types
                });
                setAttendance(records);
                setSummary({ onTime, late, absent, onLeave });
            });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <ListChecks className="mr-3 h-8 w-8" /> My Attendance
                    </h1>
                    <p className="text-muted-foreground">
                        View your attendance summary and history for this month.
                    </p>
                </div>
                <Button variant="outline">
                    <CalendarSearch className="mr-2 h-4 w-4" /> Filter (Coming Soon)
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>This Month's Attendance Summary</CardTitle>
                    <CardDescription>Overview of your attendance status for this month.</CardDescription>
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
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>Your clock-in and clock-out records for this month.</CardDescription>
                </CardHeader>
                <CardContent>
                    {attendance.length > 0 ? (
                        <ul className="space-y-3">
                            {attendance.map((record, idx) => (
                                <li key={idx} className="p-3 border rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{record.type === 'clock-in' ? 'Clock In' : 'Clock Out'}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(record.timestamp).toLocaleString()}</p>
                                    </div>
                                    {/* Optionally show status or notes */}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No attendance records found for this month.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default MyAttendance; 