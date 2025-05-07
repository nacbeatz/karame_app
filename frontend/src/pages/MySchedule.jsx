import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarDays } from 'lucide-react';

function MySchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CalendarDays className="mr-3 h-8 w-8" /> My Schedule
          </h1>
          <p className="text-muted-foreground">
            View your upcoming shifts and work assignments.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shifts</CardTitle>
          <CardDescription>Your work schedule for the upcoming period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <p className="text-muted-foreground">Schedule details will be displayed here (e.g., calendar view, list of shifts).</p>
          {/* Placeholder for actual schedule component */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Shifts</CardTitle>
          <CardDescription>Review your past work schedule and hours.</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <p className="text-muted-foreground">Historical schedule data will appear here.</p>
          {/* Placeholder for past shifts component */}
        </CardContent>
      </Card>

    </div>
  );
}

export default MySchedulePage;

