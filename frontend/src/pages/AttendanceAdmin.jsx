import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatabaseZap, Search, DownloadCloud, AlertCircle, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AttendanceAdmin() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendanceLogs = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Get user info to check role (still useful for UI customization)
        const userResponse = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const user = userResponse.data;
        setUserRole(user.role);

        // Removed role-based access control check
        // Now any authenticated user can access all records

        // Get all attendance records
        const attendanceResponse = await axios.get('http://localhost:3001/api/attendance/all', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Check if the response is valid
        if (!Array.isArray(attendanceResponse.data)) {
          console.error('Invalid response format:', attendanceResponse.data);
          setError('Received invalid data format from server');
          setAttendanceLogs([]); // Set to empty array to avoid filter error
        } else {
          console.log('All attendance records:', attendanceResponse.data);
          setAttendanceLogs(attendanceResponse.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance logs:', err);

        if (err.response && err.response.status === 401) {
          localStorage.removeItem('authToken');
          setError('Your session has expired. Please log in again.');
        } else {
          // Removed specific 403 error handling since we're allowing all roles now
          setError('Failed to load attendance data: ' + (err.response?.data?.msg || err.message));
        }

        setLoading(false);
      }
    };

    fetchAttendanceLogs();
  }, [navigate]);


  // Function to determine status based on clock-in time
  const determineStatus = (record) => {
    if (!record.AM_In || record.AM_In === "null") return 'Absent';

    const hour = parseInt(record.AM_In.split(':')[0]);
    if (hour > 9) return 'Late In';

    if (record.AM_Out && record.AM_Out !== "null") {
      const outHour = parseInt(record.AM_Out.split(':')[0]);
      if (outHour < 17) return 'Early Out';
    }

    return 'Present';
  };

  // Function to determine anomaly
  const determineAnomaly = (record) => {
    if (!record.AM_In || record.AM_In === "null") return 'Missed Clock-in';
    if (!record.AM_Out || record.AM_Out === "null") return 'Missed Clock-out';

    const hour = parseInt(record.AM_In.split(':')[0]);
    if (hour > 9) return 'Late Clock-in';

    const outHour = parseInt(record.AM_Out.split(':')[0]);
    if (outHour < 17) return 'Early Clock-out';

    return 'None';
  };

  // Filter logs based on search term
  const filteredLogs = attendanceLogs.filter(log => {
    if (!searchTerm) return true;

    const searchString = searchTerm.toLowerCase();
    return (
      (log.Name && log.Name.toLowerCase().includes(searchString)) ||
      (log.Date && log.Date.includes(searchString)) ||
      (log.Remark && log.Remark.toLowerCase().includes(searchString))
    );
  });

  // Handle export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ['No', 'Name', 'Date', 'Clock In', 'Clock Out', 'Status', 'Remark'];
    const csvRows = [headers];

    filteredLogs.forEach(log => {
      const status = determineStatus(log);
      csvRows.push([
        log.No || '',
        log.Name || '',
        log.Date || '',
        log.AM_In !== "null" ? log.AM_In : '',
        log.AM_Out !== "null" ? log.AM_Out : '',
        status,
        log.Remark || ''
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle edit record (placeholder - would open a modal in a real implementation)
  const handleEditRecord = (record) => {
    console.log('Edit record:', record);
    // In a real implementation, you would open a modal or navigate to an edit page
    alert(`Edit functionality would open for record: ${record._id}`);
  };

  // Handle delete record
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/attendance/${recordId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove the record from state
      setAttendanceLogs(attendanceLogs.filter(log => log._id !== recordId));
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record: ' + (err.response?.data?.msg || err.message));
    }
  };

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
          <Button variant="outline" onClick={exportToCSV}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>View, search, and manage all employee attendance records.</CardDescription>
          <div className="pt-4 flex items-center space-x-2">
            <Input
              placeholder="Search logs (Name, Date, Remark...)"
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading attendance data...</div>
          ) : error ? (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anomaly</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        <div className="flex flex-col items-center py-4">
                          <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                          <p>No attendance records found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm ? 'Try adjusting your search term.' : 'There are no attendance records in the system.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => {
                      const status = determineStatus(log);
                      const anomaly = determineAnomaly(log);

                      return (
                        <TableRow key={log._id || index}>
                          <TableCell>{log.No || index + 1}</TableCell>
                          <TableCell className="font-medium">{log.Name || 'Unknown'}</TableCell>
                          <TableCell>{log.Date || 'N/A'}</TableCell>
                          <TableCell>{log.AM_In && log.AM_In !== "null" ? log.AM_In : '-'}</TableCell>
                          <TableCell>{log.AM_Out && log.AM_Out !== "null" ? log.AM_Out : '-'}</TableCell>
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
                            {anomaly}
                          </TableCell>
                          <TableCell>{log.Remark || '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-blue-100 dark:hover:bg-blue-800"
                                onClick={() => handleEditRecord(log)}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-red-100 dark:hover:bg-red-800"
                                onClick={() => handleDeleteRecord(log._id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceAdmin;
