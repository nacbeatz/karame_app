import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, CalendarSearch, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState({ onTime: 0, late: 0, absent: 0, onLeave: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [clockInLoading, setClockInLoading] = useState(false);
    const [clockOutLoading, setClockOutLoading] = useState(false);
    const navigate = useNavigate();

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            console.log("Starting to fetch attendance data...");

            // Get token from localStorage
            const token = localStorage.getItem('authToken');

            if (!token) {
                console.error('No token found in localStorage');
                setError('Authentication token not found. Please log in again.');
                setLoading(false);
                return;
            }

            // Get current user data
            console.log("Fetching user data...");
            let user;
            try {
                const userResponse = await axios.get('http://localhost:3001/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                user = userResponse.data;
                console.log('User data:', user);
                setUserData(user);
            } catch (userError) {
                console.error("Error fetching user data:", userError);
                setError('Failed to fetch user data: ' + (userError.response?.data?.msg || userError.message));
                setLoading(false);
                return;
            }

            // Get attendance data
            console.log("Fetching attendance data...");
            let attendanceResponse;
            try {
                attendanceResponse = await axios.get('http://localhost:3001/api/attendance', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 10000 // 10 second timeout
                });

                console.log('Attendance response:', attendanceResponse.data);
            } catch (attendanceError) {
                console.error("Error fetching attendance data:", attendanceError);
                setError('Failed to fetch attendance data: ' + (attendanceError.response?.data?.msg || attendanceError.message));
                setLoading(false);
                return;
            }

            // Handle different response structures
            let records = [];
            if (Array.isArray(attendanceResponse.data)) {
                records = attendanceResponse.data;
            } else if (attendanceResponse.data && attendanceResponse.data.logs) {
                records = attendanceResponse.data.logs;
            } else if (typeof attendanceResponse.data === 'object') {
                // Try to extract any array property from the response
                const possibleArrays = Object.values(attendanceResponse.data).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                    records = possibleArrays[0];
                }
            }

            console.log('Processed records:', records);
            setAttendance(records || []);

            // Calculate summary statistics
            if (Array.isArray(records) && records.length > 0) {
                // Group records by date
                const recordsByDate = {};
                records.forEach(record => {
                    let date;
                    if (record.timestamp) {
                        date = new Date(record.timestamp).toISOString().split('T')[0];
                    } else if (record.Date) {
                        date = record.Date;
                    } else {
                        return; // Skip records without date information
                    }

                    if (!recordsByDate[date]) {
                        recordsByDate[date] = [];
                    }
                    recordsByDate[date].push(record);
                });

                console.log('Records grouped by date:', recordsByDate);

                // Calculate summary
                let onTime = 0, late = 0, absent = 0, onLeave = 0;

                Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
                    console.log(`Processing records for date ${date}:`, dayRecords);

                    // Check if there's a clock-in record for this day
                    const clockInRecord = dayRecords.find(r =>
                        (r.type === 'clock-in') || (r.AM_In && r.AM_In !== "null")
                    );

                    if (clockInRecord) {
                        let isLate = false;

                        if (clockInRecord.type === 'clock-in' && clockInRecord.timestamp) {
                            const clockInTime = new Date(clockInRecord.timestamp);
                            const hour = clockInTime.getHours();
                            const minutes = clockInTime.getMinutes();
                            isLate = hour > 9 || (hour === 9 && minutes > 0);
                        } else if (clockInRecord.AM_In && clockInRecord.AM_In !== "null") {
                            const timeParts = clockInRecord.AM_In.split(':');
                            if (timeParts.length >= 2) {
                                const hour = parseInt(timeParts[0]);
                                const minutes = parseInt(timeParts[1]);
                                isLate = hour > 9 || (hour === 9 && minutes > 0);
                            }
                        }

                        if (isLate) {
                            console.log(`Late arrival on ${date}:`, clockInRecord);
                            late++;
                        } else {
                            onTime++;
                        }
                    } else {
                        // No clock-in record for this day
                        const isLeaveDay = dayRecords.some(r =>
                            (r.Remark && r.Remark.toLowerCase().includes('leave')) ||
                            (r.notes && r.notes.toLowerCase().includes('leave'))
                        );

                        if (isLeaveDay) {
                            onLeave++;
                        } else {
                            absent++;
                        }
                    }
                });

                console.log('Final calculated summary:', { onTime, late, absent, onLeave });
                setSummary({ onTime, late, absent, onLeave });
            } else {
                console.log('No records found, setting default summary');
                setSummary({ onTime: 0, late: 0, absent: 0, onLeave: 0 });
            }

            console.log("Finished processing attendance data");
            setLoading(false);
        } catch (err) {
            console.error('Unexpected error in fetchAttendanceData:', err);
            setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("MyAttendance component mounted");
        fetchAttendanceData();

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.log("Safety timeout triggered - forcing loading state to false");
                setLoading(false);
                setError("Request timed out. Please try refreshing the page.");
            }
        }, 15000); // 15 seconds timeout

        return () => {
            clearTimeout(safetyTimeout);
            console.log("MyAttendance component unmounted");
        };
    }, []);

    // Handle clock-in
    const handleClockIn = async () => {
        try {
            setClockInLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                setError('Authentication token not found. Please log in again.');
                setClockInLoading(false);
                return;
            }

            await axios.post('http://localhost:3001/api/attendance/clock-in', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Refresh attendance data
            await fetchAttendanceData();
            setClockInLoading(false);
        } catch (err) {
            console.error('Error clocking in:', err);
            setError('Failed to clock in: ' + (err.response?.data?.msg || err.message));
            setClockInLoading(false);
        }
    };

    // Handle clock-out
    const handleClockOut = async () => {
        try {
            setClockOutLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                setError('Authentication token not found. Please log in again.');
                setClockOutLoading(false);
                return;
            }

            await axios.post('http://localhost:3001/api/attendance/clock-out', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Refresh attendance data
            await fetchAttendanceData();
            setClockOutLoading(false);
        } catch (err) {
            console.error('Error clocking out:', err);
            setError('Failed to clock out: ' + (err.response?.data?.msg || err.message));
            setClockOutLoading(false);
        }
    };

    // Redirect to login if needed
    const handleLoginRedirect = () => {
        navigate('/login');
    };

    // Check if user has already clocked in today
    const hasClockInToday = () => {
        const today = new Date().toISOString().split('T')[0];
        return attendance.some(record =>
            (record.Date === today && record.AM_In && record.AM_In !== "null") ||
            (record.timestamp && new Date(record.timestamp).toISOString().split('T')[0] === today && record.type === "clock-in")
        );
    };

    // Check if user has already clocked out today
    const hasClockOutToday = () => {
        const today = new Date().toISOString().split('T')[0];
        return attendance.some(record =>
            (record.Date === today && record.AM_Out && record.AM_Out !== "null") ||
            (record.timestamp && new Date(record.timestamp).toISOString().split('T')[0] === today && record.type === "clock-out")
        );
    };

    // Force refresh button handler
    const handleForceRefresh = () => {
        setLoading(true);
        setError(null);
        fetchAttendanceData();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <ListChecks className="mr-3 h-8 w-8" /> My Attendance
                    </h1>
                    <p className="text-muted-foreground">
                        View your attendance summary and history.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleForceRefresh} disabled={loading}>
                        {loading ? "Loading..." : "Refresh Data"}
                    </Button>
                    <Button variant="outline">
                        <CalendarSearch className="mr-2 h-4 w-4" /> Filter (Coming Soon)
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading attendance data...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={handleForceRefresh}>Try Again</Button>
                        <Button onClick={handleLoginRedirect} variant="outline">Go to Login</Button>
                    </div>
                </div>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Attendance</CardTitle>
                            <CardDescription>Record your attendance for today.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    onClick={handleClockIn}
                                    disabled={clockInLoading || hasClockInToday()}
                                    className="flex-1"
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {clockInLoading ? 'Processing...' : hasClockInToday() ? 'Already Clocked In' : 'Clock In'}
                                </Button>
                                <Button
                                    onClick={handleClockOut}
                                    disabled={clockOutLoading || hasClockOutToday() || !hasClockInToday()}
                                    className="flex-1"
                                    variant={hasClockOutToday() ? "outline" : "default"}
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {clockOutLoading ? 'Processing...' : hasClockOutToday() ? 'Already Clocked Out' : 'Clock Out'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Summary</CardTitle>
                            <CardDescription>Overview of your attendance status.</CardDescription>
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
                            <CardDescription>Your attendance records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendance.length > 0 ? (
                                <ul className="space-y-3">
                                    {attendance.map((record, idx) => {
                                        // Determine if this record is a late arrival
                                        let isLate = false;

                                        if (record.type === 'clock-in' && record.timestamp) {
                                            const clockInTime = new Date(record.timestamp);
                                            const hour = clockInTime.getHours();
                                            const minutes = clockInTime.getMinutes();
                                            isLate = hour > 9 || (hour === 9 && minutes > 0);
                                        } else if (record.AM_In && record.AM_In !== "null") {
                                            const timeParts = record.AM_In.split(':');
                                            if (timeParts.length >= 2) {
                                                const hour = parseInt(timeParts[0]);
                                                const minutes = parseInt(timeParts[1]);
                                                isLate = hour > 9 || (hour === 9 && minutes > 0);
                                            }
                                        }

                                        return (
                                            <li key={idx} className={`p-3 border rounded-md flex justify-between items-center ${isLate ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                                <div>
                                                    {/* Handle both old and new data formats */}
                                                    {record.type ? (
                                                        <>
                                                            <p className="font-medium">
                                                                {record.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
                                                                {isLate && record.type === 'clock-in' &&
                                                                    <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                                                        Late Arrival
                                                                    </span>
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(record.timestamp).toLocaleString()}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-medium">
                                                                Date: {record.Date}
                                                                {isLate &&
                                                                    <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                                                        Late Arrival
                                                                    </span>
                                                                }
                                                            </p>
                                                            <div className="flex flex-col sm:flex-row sm:space-x-4">
                                                                <p className="text-sm text-muted-foreground">
                                                                    Clock In: {record.AM_In && record.AM_In !== "null" ? record.AM_In : "Not recorded"}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Clock Out: {record.AM_Out && record.AM_Out !== "null" ? record.AM_Out : "Not recorded"}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {(record.notes || record.Remark) && (
                                                    <span className="text-sm text-muted-foreground">{record.notes || record.Remark}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                    <p>No attendance records found.</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Records will appear here after you clock in for the first time.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default MyAttendance;
