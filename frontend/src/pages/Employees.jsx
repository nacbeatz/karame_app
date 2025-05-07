import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react';

function EmployeesPage() {
  // Placeholder for actual employee data and logic
  const employees = [
    { id: "EMP001", name: "John Doe", role: "Doctor", department: "Cardiology", status: "Active" },
    { id: "EMP002", name: "Jane Smith", role: "Nurse", department: "Pediatrics", status: "Active" },
    { id: "EMP003", name: "Mike Brown", role: "Technician", department: "Radiology", status: "Inactive" },
    { id: "EMP004", name: "Lisa White", role: "Admin Staff", department: "Administration", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserPlus className="mr-3 h-8 w-8" /> Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage employee profiles, roles, and access.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add New Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>View, search, and manage all employee records.</CardDescription>
          <div className="pt-4 flex items-center space-x-2">
            <Input placeholder="Search employees (Name, ID, Role, Department)..." className="max-w-sm" />
            <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-800">
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-100 dark:hover:bg-red-800">
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}

export default EmployeesPage;

