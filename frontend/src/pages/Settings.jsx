import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Palette, Lock, Clock } from 'lucide-react';

function Settings() {
  // Placeholder for actual settings data and logic
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8" /> System Settings
          </h1>
          <p className="text-muted-foreground">
            Manage application-wide configurations and preferences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" /> Notification Settings</CardTitle>
          <CardDescription>Configure how you receive notifications from the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive important updates and alerts via email.
              </span>
            </Label>
            <Switch id="email-notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
              <span>SMS Notifications (Placeholder)</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get critical alerts via SMS (requires setup).
              </span>
            </Label>
            <Switch id="sms-notifications" disabled />
          </div>
          <Button>Save Notification Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5" /> Theme & Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Switch to a darker interface theme.
              </span>
            </Label>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          {/* Add more appearance settings here if needed */}
          <Button>Save Appearance Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5" /> Security & Privacy</CardTitle> {/* Changed to Lock */}
          <CardDescription>Manage security settings and data privacy options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-md">
            <Label htmlFor="password-change">Change Password</Label>
            <Input type="password" id="current-password" placeholder="Current Password" className="mt-1"/>
            <Input type="password" id="new-password" placeholder="New Password" className="mt-2"/>
            <Input type="password" id="confirm-password" placeholder="Confirm New Password" className="mt-2"/>
            <Button className="mt-3">Update Password</Button>
          </div>
          <p className="text-xs text-muted-foreground">Further security settings (e.g., two-factor authentication, data export/deletion) would be managed here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> General Application Settings</CardTitle>
          <CardDescription>Configure hospital name, logo, time zone, date/time formats.</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
            <p className="text-muted-foreground">General settings configuration interface will be here (e.g., Hospital Name, Logo upload, Timezone select).</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;