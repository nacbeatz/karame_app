# User Workflow: Hospital Workforce Management Application

## 1. Introduction

This document outlines the proposed user workflow for the AI-powered hospital workforce management application. It details how different user roles will interact with the system to perform various tasks related to attendance, scheduling, task management, reporting, and data administration. The application aims to integrate seamlessly with the DFACE702 biometric device and provide real-time insights and control.

## 2. User Roles

The application will support the following user roles with distinct permissions and access levels:

*   **Employee:** Regular hospital staff members.
*   **HR Personnel:** Staff responsible for human resources administration.
*   **Team Leader:** Staff responsible for managing specific teams or services.
*   **Manager:** Senior staff with oversight over multiple teams or the entire hospital operations related to workforce management.

## 3. Common Workflows

*   **Login:** All users will access the application via a secure web-based login page using their credentials. The interface will be responsive, adapting to different screen sizes (desktops, tablets, mobiles).
*   **Dashboard:** Upon login, each user will see a personalized dashboard relevant to their role, displaying key information like upcoming shifts, pending tasks, recent notifications, and attendance summaries.
*   **Notifications:** Users will receive real-time notifications for relevant events (e.g., shift assignments, task updates, leave request status, attendance alerts).

## 4. Role-Specific Workflows

### 4.1. Employee Workflow

1.  **Login:** Access the application.
2.  **View Dashboard:** See personal schedule (shifts), assigned tasks, recent attendance clock-ins/outs, leave balance, and notifications.
3.  **Attendance:**
    *   Clock In/Out: Use the DFACE702 device. The application will reflect this data in near real-time.
    *   View Attendance History: Access personal records of clock-ins, clock-outs, total hours worked, and calculated supplementary hours.
    *   Report Discrepancies: Flag potential errors in attendance records for review by HR or Team Leader.
4.  **Shift Management:** View assigned shifts (daily, weekly, monthly view).
5.  **Task Management:** View assigned tasks and deadlines.
6.  **Availability Management:**
    *   Request Leave: Submit requests for annual leave, specifying dates.
    *   Report Sick Leave: Notify absence due to sickness.
    *   View Request Status: Track the approval status of leave requests.
7.  **View Reports:** Access personal monthly performance/attendance summaries.

### 4.2. HR Personnel Workflow

1.  **Login:** Access the application.
2.  **Manage Employee Data:**
    *   Add New Employees: Enter details for new hires.
    *   Update Employee Information: Modify existing employee records (contact details, roles, assigned team, etc.).
    *   Deactivate Employees: Manage records for departing employees.
3.  **Manage Leave Policies:** Define and update rules for different types of leave (annual, sick, etc.) and entitlement calculations.
4.  **Manage Attendance Records:** Review flagged discrepancies, make manual adjustments if necessary (with audit trail).
5.  **Generate Reports:** Create hospital-wide reports on attendance trends, leave balances, overtime, etc. Utilize templates based on provided Excel files.
6.  **Manage System Data:** (Potentially) Manage lists of departments, job roles, shift types.
7.  **User Access Control:** (Potentially) Assign roles and permissions to users.
8.  **View Audit Logs:** Track significant changes made within the system.

### 4.3. Team Leader Workflow

1.  **Login:** Access the application.
2.  **View Team Dashboard:** Get an overview of the team's current status: who is clocked in, upcoming shifts, pending leave requests, team notifications (e.g., AI-detected attendance anomalies).
3.  **Dispatching (Shift & Task Management):**
    *   Assign Shifts: Create and assign shifts to team members, considering availability and workload.
    *   Assign Tasks: Assign specific tasks to individuals within the team.
    *   Manage Team Schedule: View and adjust the team's overall schedule.
4.  **Availability Management:**
    *   Review & Approve/Reject Requests: Action leave/sickness requests submitted by team members.
    *   View Team Availability: See an overview of team members' scheduled shifts, approved leave, and reported sickness.
5.  **Monitor Attendance:** View real-time attendance status of team members. Receive alerts for anomalies (late arrivals, early departures, missed clock-ins) detected by the AI.
6.  **Generate Team Reports:** Create reports specific to the team's performance, attendance, overtime, etc., potentially using AI-generated summaries.

### 4.4. Manager Workflow

1.  **Login:** Access the application.
2.  **View Hospital-Wide Dashboard:** Get a high-level overview of workforce status across all teams/departments, key performance indicators, and critical alerts.
3.  **Full Data Management (CRUD):** Access and manage all data entities within the system (Employees, Teams, Shifts, Tasks, Departments, etc.). Includes all capabilities of HR and Team Leaders.
4.  **Approve/Override:** Handle escalated approvals or override decisions made by Team Leaders (e.g., leave requests).
5.  **System Configuration:** Manage overall application settings (e.g., notification preferences, reporting parameters).
6.  **Generate Comprehensive Reports:** Create detailed reports across multiple teams or the entire hospital, leveraging AI for insights and summaries.
7.  **Access Control Oversight:** Oversee user roles and permissions across the application.

## 5. Core Features & Integration

*   **DFACE702 Integration:** The application will continuously or periodically sync attendance data (clock-ins/outs) from the DFACE702 device using the specified `zk-jubaer` Node.js library (or an equivalent mechanism if a different backend technology is chosen). This ensures attendance data is up-to-date.
*   **AI-Powered Insights:** The system will incorporate AI to:
    *   Detect attendance anomalies (e.g., late clock-ins, early clock-outs, unscheduled absences).
    *   Generate insightful summaries for reports.
    *   (Future Potential) Provide predictive scheduling suggestions based on historical data and demand forecasts.
*   **Reporting:** The system will allow users to generate reports based on the structure of the provided Excel files (`conge Annuel.xlsx`, `Report February 2025 (3).xlsx`), using the initial data from these files where applicable.
*   **Data Entry & Management:** Secure interfaces for authorized users (primarily HR and Managers) to manage core data (employees, teams, shifts).

## 6. Accessibility

The application will be a web application accessible from any device with a modern web browser and internet connection. The user interface will be designed responsively to ensure usability on desktops, tablets, and smartphones.
