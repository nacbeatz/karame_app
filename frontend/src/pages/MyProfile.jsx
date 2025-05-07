import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Edit3 } from 'lucide-react';
import { Label } from "@/components/ui/label";

function MyProfilePage() {
  // Placeholder for actual user data
  const userProfile = {
    name: "Centrinno Test",
    employeeId: "EMP12345",
    email: "centrinno.test@example.com",
    phone: "+1-555-123-4567",
    department: "Cardiology",
    jobTitle: "Registered Nurse",
    reportingManager: "Dr. Emily Carter",
    dateOfHire: "2022-08-15",
    emergencyContactName: "Jane Doe",
    emergencyContactPhone: "+1-555-765-4321",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserCircle className="mr-3 h-8 w-8" /> My Profile
          </h1>
          <p className="text-muted-foreground">
            View and manage your personal and employment information.
          </p>
        </div>
        <Button variant="outline">
          <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-sm text-muted-foreground">Full Name</Label><p>{userProfile.name}</p></div>
          <div><Label className="text-sm text-muted-foreground">Employee ID</Label><p>{userProfile.employeeId}</p></div>
          <div><Label className="text-sm text-muted-foreground">Email Address</Label><p>{userProfile.email}</p></div>
          <div><Label className="text-sm text-muted-foreground">Phone Number</Label><p>{userProfile.phone}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-sm text-muted-foreground">Department</Label><p>{userProfile.department}</p></div>
          <div><Label className="text-sm text-muted-foreground">Job Title</Label><p>{userProfile.jobTitle}</p></div>
          <div><Label className="text-sm text-muted-foreground">Reporting Manager</Label><p>{userProfile.reportingManager}</p></div>
          <div><Label className="text-sm text-muted-foreground">Date of Hire</Label><p>{userProfile.dateOfHire}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-sm text-muted-foreground">Contact Name</Label><p>{userProfile.emergencyContactName}</p></div>
          <div><Label className="text-sm text-muted-foreground">Contact Phone</Label><p>{userProfile.emergencyContactPhone}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] flex flex-col items-start justify-center bg-slate-100 dark:bg-slate-800 rounded-md p-4 space-y-2">
          <Button variant="link" className="p-0 h-auto">View Employment Contract</Button>
          <Button variant="link" className="p-0 h-auto">View Payslips</Button>
          <Button variant="link" className="p-0 h-auto">Manage Notification Preferences</Button>
        </CardContent>
      </Card>

    </div>
  );
}

export default MyProfilePage;

