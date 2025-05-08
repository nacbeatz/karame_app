import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, History, PlusCircle } from 'lucide-react';

function MyLeave() {
  // Placeholder for actual leave data and logic
  const leaveBalances = [
    { type: "Annual Leave", balance: 12, unit: "days" },
    { type: "Sick Leave", balance: 8, unit: "days" },
    { type: "Unpaid Leave", balance: 5, unit: "days" },
  ];

  const leaveRequests = [
    { id: 1, type: "Annual Leave", startDate: "2025-06-10", endDate: "2025-06-12", status: "Approved" },
    { id: 2, type: "Sick Leave", startDate: "2025-05-20", endDate: "2025-05-20", status: "Pending" },
    { id: 3, type: "Annual Leave", startDate: "2025-07-01", endDate: "2025-07-05", status: "Rejected" },
  ];

  // Debug log to confirm component is rendering
  console.log("MyLeave component mounted");

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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Request New Leave
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
          <CardDescription>Your current available leave entitlements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaveBalances.map((item, index) => (
              <Card key={index} className="p-4">
                <CardTitle className="text-lg">{item.type}</CardTitle>
                <p className="text-2xl font-bold">{item.balance} <span className="text-sm text-muted-foreground">{item.unit}</span></p>
              </Card>
            ))}
          </div>
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
          {leaveRequests.length > 0 ? (
            <ul className="space-y-3">
              {leaveRequests.map((request) => (
                <li key={request.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{request.type}</p>
                    <p className="text-sm text-muted-foreground">{request.startDate} to {request.endDate}</p>
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