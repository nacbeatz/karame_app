import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Filter, ListFilter } from 'lucide-react';

function LeaveApprovals() {
  // Placeholder for actual leave approval data and logic
  const pendingRequests = [
    { id: 1, employeeName: "John Smith", leaveType: "Annual Leave", startDate: "2025-06-15", endDate: "2025-06-18", reason: "Family vacation" },
    { id: 2, employeeName: "Alice Brown", leaveType: "Sick Leave", startDate: "2025-05-28", endDate: "2025-05-29", reason: "Flu symptoms" },
    { id: 3, employeeName: "Bob Green", leaveType: "Unpaid Leave", startDate: "2025-07-01", endDate: "2025-07-03", reason: "Personal reasons" },
  ];

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
        <Button variant="outline">
          <ListFilter className="mr-2 h-4 w-4" /> Filter Requests
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Leave requests awaiting your action.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-semibold text-lg">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{request.leaveType}: {request.startDate} to {request.endDate}</p>
                      <p className="text-sm mt-1">Reason: {request.reason}</p>
                    </div>
                    <div className="flex space-x-2 mt-3 sm:mt-0">
                      <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="outline" size="sm" className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300">
                        <XCircle className="mr-1 h-4 w-4" /> Reject
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

