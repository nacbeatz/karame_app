import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartBig, FileText, Download, Filter } from 'lucide-react';

function Reports() {
  // Placeholder for actual report data and generation logic
  const availableReports = [
    { id: 1, name: "Monthly Attendance Summary", description: "Overall attendance statistics for the selected month." },
    { id: 2, name: "Leave Balance Report", description: "Current leave balances for all employees." },
    { id: 3, name: "Overtime Report", description: "Details of overtime hours worked by employees." },
    { id: 4, name: "Payroll Input Report", description: "Hours worked data for payroll processing." },
    { id: 5, name: "Employee Headcount Report", description: "Demographic and headcount statistics." },
    { id: 6, name: "Scheduling Compliance Report", description: "Adherence to scheduled shifts and staffing levels." },
    { id: 7, name: "Labor Cost Analysis", description: "Breakdown of labor costs based on hours and roles." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <BarChartBig className="mr-3 h-8 w-8" /> Reports
          </h1>
          <p className="text-muted-foreground">
            Generate, view, and analyze workforce data reports.
          </p>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filter / Customize Reports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select a report to generate and view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableReports.map((report) => (
              <Card key={report.id} className="p-4 flex flex-col justify-between">
                <div>
                  <FileText className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-lg mb-1">{report.name}</CardTitle>
                  <CardDescription className="text-xs mb-3">{report.description}</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Generate / View
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generation</CardTitle>
          <CardDescription>Build custom reports based on specific criteria (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
          <p className="text-muted-foreground">Custom report builder interface will be here.</p>
        </CardContent>
      </Card>

    </div>
  );
}

export default Reports;

