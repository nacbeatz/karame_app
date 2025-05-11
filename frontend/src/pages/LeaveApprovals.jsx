import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Filter, ListFilter } from 'lucide-react';
import axios from 'axios';

function LeaveApprovals() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // requestId being processed
  const [error, setError] = useState(null);

  // Fetch pending leave requests (with console logs and axios)
  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching /api/leave-requests?status=Pending ...');
      // Try axios first
      const token = localStorage.getItem('authToken');
      const res = await axios.get('/api/leave-requests?status=Pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API response:', res);
      setPendingRequests(res.data.requests || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err.response?.data?.msg || err.message || 'Error fetching leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Approve handler
  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.put(
        `/api/leave-requests/${requestId}/approve`,
        { comment: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Error approving request');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject handler
  const handleReject = async (requestId) => {
    const rejectionReason = prompt('Enter rejection reason:');
    if (!rejectionReason) return;
    setActionLoading(requestId);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.put(
        `/api/leave-requests/${requestId}/reject`,
        { rejectionReason, comment: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Error rejecting request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CheckCircle className="mr-3 h-8 w-8" /> Leave Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and process pending leave requests from your team.
          </p>
        </div>
        <Button variant="outline" onClick={fetchPendingRequests} disabled={loading}>
          <ListFilter className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Leave requests awaiting your action.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-8">{error}</p>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request._id} className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-semibold text-lg">
                        {request.employeeId?.firstName} {request.employeeId?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.leaveTypeId?.name || request.leaveType}:
                        {" "}{new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-1">Reason: {request.reason}</p>
                    </div>
                    <div className="flex space-x-2 mt-3 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading === request._id}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {actionLoading === request._id ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                        onClick={() => handleReject(request._id)}
                        disabled={actionLoading === request._id}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        {actionLoading === request._id ? 'Rejecting...' : 'Reject'}
                      </Button>
                      <Button variant="link" size="sm">Request More Info</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No pending leave requests.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved/Rejected History</CardTitle>
          <CardDescription>View past leave request decisions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <Filter className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground ml-2">Historical approval data will appear here.</p>
          {/* Placeholder for history component */}
        </CardContent>
      </Card>
    </div>
  );
}

export default LeaveApprovals;

