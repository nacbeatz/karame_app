import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatabaseZap, Search, Edit, ShieldAlert, UploadCloud, DownloadCloud } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom'; // Import for navigation

function AttendanceAdmin() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // For redirecting to login page if needed

  useEffect(() => {
    const fetchAttendanceLogs = async () => {
      try {
        setLoading(true);
        
        // Check for token in multiple possible locations
        // Adjust these based on how your auth system stores the token
        const token = 
          localStorage.getItem('token') || 
          localStorage.getItem('authToken') || 
          sessionStorage.getItem('token') ||
          document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Make the API request with the token
        const response = await axios.get('/api/attendance', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          // Add a timeout to prevent hanging requests
          timeout: 10000
        });
        
        if (response.data && response.data.logs) {
          setAttendanceLogs(response.data.logs);
        } else {
          setAttendanceLogs([]);
          console.warn('No logs found in response:', response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance logs:', err);
        
        // Handle different types of errors
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 401 || err.response.status === 403) {
            setError('Your session has expired. Please log in again.');
            // Optionally redirect to login page after a delay
            setTimeout(() => navigate('/login'), 3000);
          } else {
            setError(`Server error: ${err.response.data.msg || 'Failed to load attendance data'}`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request
          setError(`Error: ${err.message}`);
        }
        
        setLoading(false);
      }
    };

    fetchAttendanceLogs();
  }, [navigate]);

  // Function to handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Function to determine status based on clock-in and clock-out times
  const determineStatus = (clockIn, clockOut) => {
    if (!clockIn && !clockOut) return 'Absent';
    
    // Convert times to Date objects for comparison (assuming 9:00 AM is standard start time)
    const standardStart = new Date();
    standardStart.setHours(9, 0, 0);
    
    const clockInTime = clockIn ? new Date(`2000-01-01T${clockIn}`) : null;
    
    if (clockInTime && clockInTime > standardStart) {
      return 'Late In';
    }
    
    return 'Present';
  };

  // Function to determine if there's an anomaly
  const determineAnomaly = (status) => {
    switch (status) {
      case 'Late In':
        return 'Late Clock-in';
      case 'Early Out':
        return 'Early Clock-out';
      case 'Absent':
        return 'Missed Clock-in/out';
      default:
        return 'None';
    }
  };

  // Filter logs based on search term
  const filteredLogs = attendanceLogs.filter(log => {
    if (!searchTerm) return true;
    
    const searchString = searchTerm.toLowerCase();
    const employeeName = `${log.userId?.firstName || ''} ${log.userId?.lastName || ''}`.toLowerCase();
    const date = new Date(log.timestamp).toLocaleDateString();
    
    return (
      employeeName.includes(searchString) ||
      date.includes(searchString) ||
      (log.type && log.type.toLowerCase().includes(searchString))
    );
  });

  // Group logs by date to show clock-in and clock-out on the same row
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { 
        date, 
        name: `${log.userId?.firstName || ''} ${log.userId?.lastName || ''}`,
        clockIn: null, 
        clockOut: null 
      };
    }
    
    if (log.type === 'clock-in') {
      acc[date].clockIn = format(new Date(log.timestamp), 'HH:mm');
    } else if (log.type === 'clock-out') {
      acc[date].clockOut = format(new Date(log.timestamp), 'HH:mm');
    }
    
    acc[date].notes = log.notes;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <DatabaseZap className="mr-3 h-8 w-8" /> My Attendance Records
          </h1>
          <p className="text-muted-foreground">
            View your attendance logs and clock-in/out history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline"><DownloadCloud className="mr-2 h-4 w-4" /> Export My Data</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>View your attendance records and history.</CardDescription>
          <div className="pt-4 flex items-center space-x-2">
            <Input 
              placeholder="Search logs (Date, Type...)" 
              className="max-w-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading attendance data...</div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleLoginRedirect}>Go to Login</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>AM In</TableHead>
                  <TableHead>AM Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedLogs).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No attendance records found</TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedLogs).map(([date, record], index) => {
                    const status = determineStatus(record.clockIn, record.clockOut);
                    const anomaly = determineAnomaly(status);
                    
                    return (
                      <TableRow key={date}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell>{record.clockIn || '-'}</TableCell>
                        <TableCell>{record.clockOut || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full 
                            ${status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                              status === 'Late In' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                              status === 'Early Out' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                          `}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className={`${anomaly !== 'None' ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {record.notes || anomaly}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceAdmin;
