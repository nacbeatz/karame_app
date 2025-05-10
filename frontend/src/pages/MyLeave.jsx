import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, History, PlusCircle } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '../App';

function MyLeave() {
  const { user, token } = useAuth();

  // State for leave balances
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState('');

  // State for leave requests
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');

  // Modal state
  const [open, setOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Fetch leave balances
  useEffect(() => {
    if (!user?.id || !token) return;
    setBalancesLoading(true);
    setBalancesError('');
    fetch(`/api/leave-requests/balances/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setLeaveBalances(data))
      .catch(err => setBalancesError('Failed to load leave balances.'))
      .finally(() => setBalancesLoading(false));
  }, [user, token]);

  // Fetch leave requests
  const fetchLeaveRequests = () => {
    if (!token) return;
    setRequestsLoading(true);
    setRequestsError('');
    fetch('/api/leave-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setLeaveRequests(data.requests || []))
      .catch(err => setRequestsError('Failed to load leave requests.'))
      .finally(() => setRequestsLoading(false));
  };
  useEffect(() => {
    fetchLeaveRequests();
  }, [token]);

  // Fetch leave types for the dropdown
  useEffect(() => {
    if (open) {
      fetch('/api/leave-types')
        .then(res => res.json())
        .then(data => setLeaveTypes(data))
        .catch(() => setLeaveTypes([]));
    }
  }, [open]);

  // Calculate number of days (simple, inclusive)
  function calculateDays(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    const numberOfDays = calculateDays(form.startDate, form.endDate);
    if (numberOfDays <= 0) {
      setFeedback('End date must be after start date.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, numberOfDays })
      });
      if (res.ok) {
        setFeedback('Leave request submitted!');
        fetchLeaveRequests(); // Refresh requests
        setTimeout(() => {
          setOpen(false);
          setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
          setFeedback('');
        }, 1200);
      } else {
        const data = await res.json();
        setFeedback(data.msg || 'Failed to submit leave request.');
      }
    } catch (err) {
      setFeedback('Server error.');
    }
    setSubmitting(false);
  };

  if (!user?.id || !token) {
    return <div className="text-center py-8">Please log in again to view your leave information.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Plane className="mr-3 h-8 w-8" /> My Leave
          </h1>
          <p className="text-muted-foreground">
            Manage your leave requests and view your balances.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Request New Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request New Leave</DialogTitle>
              <DialogDescription>Fill in the form to submit a leave request.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Leave Type</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.leaveTypeId}
                  onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map(lt => (
                    <option key={lt._id} value={lt._id}>{lt.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Reason</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
              {feedback && <div className="text-center text-sm mt-2 text-red-600">{feedback}</div>}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
          <CardDescription>Your current available leave entitlements.</CardDescription>
        </CardHeader>
        <CardContent>
          {balancesLoading ? (
            <div className="text-center py-4">Loading leave balances...</div>
          ) : balancesError ? (
            <div className="text-center text-red-500 py-4">{balancesError}</div>
          ) : leaveBalances.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No leave balances found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leaveBalances.map((item, index) => (
                <Card key={item.leaveTypeId || index} className="p-4">
                  <CardTitle className="text-lg">{item.leaveTypeName}</CardTitle>
                  <p className="text-2xl font-bold">{item.balance} <span className="text-sm text-muted-foreground">days</span></p>
                  <p className="text-xs text-muted-foreground">Entitled: {item.entitled ?? '--'} | Taken: {item.taken ?? '--'} | Pending: {item.pending ?? '--'}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" /> Leave Request History
          </CardTitle>
          <CardDescription>Track the status of your submitted leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4">Loading leave requests...</div>
          ) : requestsError ? (
            <div className="text-center text-red-500 py-4">{requestsError}</div>
          ) : leaveRequests.length > 0 ? (
            <ul className="space-y-3">
              {leaveRequests.map((request) => (
                <li key={request._id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{request.leaveTypeId?.name || '--'}</p>
                    <p className="text-sm text-muted-foreground">{request.startDate?.slice(0, 10)} to {request.endDate?.slice(0, 10)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${request.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                  `}>
                    {request.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">No leave requests found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MyLeave;