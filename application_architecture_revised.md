# Application Architecture: Hospital Workforce Management (Revised)

## 1. Overview

Based on the user's updated preference, the architecture is revised to use Node.js for the backend, React for the frontend, and MongoDB as the database. This stack facilitates the required real-time features and direct integration with the Node.js-based `zk-jubaer` library for DFACE702 communication.

## 2. Components

1.  **Frontend (Web Application):**
    *   **Technology:** React (using the `create_react_app` template).
    *   **Responsibilities:** Provides the user interface for all roles (Employee, HR, Team Leader, Manager). Handles user interactions, displays data, and connects to the backend API for data retrieval/modification and real-time updates via WebSockets. Ensures a responsive design.
    *   **Communication:** Interacts with the Node.js Backend via RESTful APIs and establishes a WebSocket connection (using Socket.IO client) for receiving real-time updates.

2.  **Backend (Application Server):**
    *   **Technology:** Node.js (with Express.js framework).
    *   **Responsibilities:** Handles core business logic (scheduling, task assignment, availability rules, reporting logic), user authentication and authorization, manages database interactions (MongoDB via Mongoose), provides RESTful APIs for the frontend, implements AI features (anomaly detection, report summaries), manages real-time communication (Socket.IO), and directly integrates with the DFACE702 device using `zk-jubaer`.
    *   **Communication:** Exposes REST APIs for the frontend. Establishes WebSocket connections with clients using Socket.IO. Connects directly to DFACE702 device(s) via TCP/IP using `zk-jubaer`.

3.  **Database:**
    *   **Technology:** MongoDB.
    *   **Responsibilities:** Stores all persistent data, including user accounts, employee details, team structures, shift schedules, task assignments, attendance records, leave requests, system configurations, and audit logs. (Note: A running MongoDB instance is assumed to be available; connection details will be configured via environment variables).

## 3. Data Flow (Real-time Attendance Example)

1.  An employee clocks in/out using the DFACE702 device.
2.  The Node.js Backend, connected to the device using `zk-jubaer`, receives the attendance event in real-time.
3.  The Node.js Backend validates the data and updates/creates the corresponding attendance record in the MongoDB database using Mongoose.
4.  The Node.js Backend uses Socket.IO to broadcast the update to relevant connected frontend clients (e.g., the employee's dashboard, the team leader's dashboard, HR/Manager views).
5.  The React Frontend receives the update via its Socket.IO connection and dynamically updates the UI to reflect the new attendance status without requiring a page refresh.

## 4. Rationale

*   **Unified Backend:** Simplifies the architecture by using Node.js for both core logic and device integration, eliminating the need for a separate service.
*   **Native Integration:** Directly uses the required `zk-jubaer` Node.js library.
*   **Real-time Focus:** Node.js and Socket.IO are well-suited for handling real-time WebSocket communication.
*   **Flexible Data Model:** MongoDB offers flexibility suitable for potentially evolving data structures.
*   **Template Alignment:** Utilizes the `create_react_app` template for the frontend.

## 5. Next Steps

Proceed with setting up the project structure based on this revised architecture (React frontend, Node.js backend) and begin developing a prototype focusing on core features like device integration, attendance tracking via MongoDB, and real-time UI updates.
