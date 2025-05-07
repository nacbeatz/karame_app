# Application Page Structure & Navigation Design

This document outlines the proposed page structure and navigation flow for the Hospital Workforce Management application prototype.

## 1. Overall Layout

*   **Login Page:** A dedicated page for user authentication.
*   **Main Application Layout (Post-Login):**
    *   A persistent **Sidebar** for primary navigation between application sections.
    *   A **Top Navigation Bar** containing user information (e.g., name, role) and a Logout button.
    *   A main **Content Area** where the selected page/component is rendered.

## 2. Navigation Items (Sidebar)

Navigation items in the sidebar will be dynamically displayed based on the logged-in user's role. The proposed structure is as follows:

**Common (All Roles):**
*   `/dashboard`: **Dashboard** - Displays a summary relevant to the user (e.g., upcoming shift, clock-in status, pending requests).
*   `/my-schedule`: **My Schedule** - Shows the user's personal shift schedule.
*   `/my-leave`: **My Leave** - Allows users to view their leave balances and request new leave (including Sick Leave).
*   `/profile`: **My Profile** - View/edit personal details (read-only for some fields).

**Team Leader / Manager Specific:**
*   `/team-schedule`: **Team Schedule** - View and manage schedules for their team members.
*   `/leave-approvals`: **Leave Approvals** - View and approve/reject pending leave requests from team members.
*   `/team-attendance`: **Team Attendance** - Overview of team's real-time attendance status and recent logs.
*   `/reports`: **Reports** - Access relevant team or departmental reports.

**HR / Administrator Specific:**
*   `/employees`: **Employee Management** - CRUD operations for managing user accounts and employee profiles.
*   `/roles-permissions`: **Permissions Management** - CRUD operations for defining roles and assigning permissions.
*   `/leave-types`: **Leave Configuration** - CRUD operations for managing different types of leave (e.g., Sick Leave, Annual Leave).
*   `/attendance-admin`: **Attendance Admin** - View/manage all attendance logs, review anomalies.
*   `/settings`: **System Settings** - Application-wide configurations.

**Development/Reference:**
*   `/showcase`: **Component Showcase** - Displays examples of all available UI components (as previously developed).

## 3. Routing

React Router (`react-router-dom`) will be used to handle navigation between these pages based on the URL paths defined above.

## 4. Access Control

*   Backend APIs will enforce role-based access control for all data operations.
*   Frontend routing and UI elements (like sidebar links) will be conditionally rendered based on the user's role obtained after login.

## 5. UI Components

The layout and navigation elements (Sidebar, Top Bar, Links) will be built using the existing `shadcn/ui` components available in the template for consistency.

---

This structure provides a foundation for organizing the application's features based on user roles and priorities. It can be expanded as more features are developed.
