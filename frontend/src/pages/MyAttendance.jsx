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
            
            // Get token from localStorage
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.error('No token found in localStorage');
                setError('Authentication token not found. Please log in again.');
                setLoading(false);
                return;
            }
            
            // Get current user data
            const userResponse = await axios.get('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            const user = userResponse.data;
            setUserData(user);
            
            // Get attendance data
            const attendanceResponse = await axios.get('/api/attendance', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log('Attendance response:', attendanceResponse.data);
            
            const records = attendanceResponse.data.logs || [];
            setAttendance(records);
            
            // Calculate summary statistics based on the actual data format
            let onTime = 0, late = 0, absent = 0, onLeave = 0;
            
            records.forEach((record) => {
                if (record.AM_In && record.AM_In !== "null") {
                    const hour = parseInt(record.AM_In.split(':')[0]);
                    if (hour <= 9) onTime++;
                    else late++;
                } else {
                    absent++;
                }
                // Add logic for onLeave if you have such records
                if (record.Remark && record.Remark.toLowerCase().includes('leave')) {
                    onLeave++;
                }
            });
            
            setSummary({ onTime, late, absent, onLeave });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance data:', err);
            
            // Handle unauthorized errors (expired or invalid token)
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('authToken'); // Clear the invalid token
                setError('Your session has expired. Please log in again.');
            } else {
                setError('Failed to load attendance data. ' + (err.response?.data?.msg || err.message));
            }
            
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
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
            
            await axios.post('/api/attendance/clock-in', {}, {
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
            
            await axios.post('/api/attendance/clock-out', {}, {
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
            record.Date === today && 
            record.AM_In && 
            record.AM_In !== "null"
        );
    };

    // Check if user has already clocked out today
    const hasClockOutToday = () => {
        const today = new Date().toISOString().split('T')[0];
        return attendance.some(record => 
            record.Date === today && 
            record.AM_Out && 
            record.AM_Out !== "null"
        );
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
                <Button variant="outline">
                    <CalendarSearch className="mr-2 h-4 w-4" /> Filter (Coming Soon)
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading attendance data...</div>
            ) : error ? (
                <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={handleLoginRedirect}>Go to Login</Button>
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
                                    {attendance.map((record, idx) => (
                                        <li key={idx} className="p-3 border rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">Date: {record.Date}</p>
                                                <div className="flex flex-col sm:flex-row sm:space-x-4">
                                                    <p className="text-sm text-muted-foreground">
                                                        Clock In: {record.AM_In && record.AM_In !== "null" ? record.AM_In : "Not recorded"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Clock Out: {record.AM_Out && record.AM_Out !== "null" ? record.AM_Out : "Not recorded"}
                                                    </p>
                                                </div>
                                            </div>
                                            {record.Remark && (
                                                <span className="text-sm text-muted-foreground">{record.Remark}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                    <p>No attendance records found.</p>
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
