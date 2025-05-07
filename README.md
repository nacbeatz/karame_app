# Hospital Workforce Management Application (Prototype)

This archive contains the prototype source code for the Hospital Workforce Management application, built with React (frontend) and Node.js/Express (backend) using MongoDB.

## Included Files

*   `/frontend`: React frontend application source code.
*   `/backend`: Node.js/Express backend application source code.
*   `user_workflow.md`: Document outlining the application workflow for different user roles.
*   `application_architecture_revised.md`: Document describing the technical architecture.
*   `navigation_design.md`: Document outlining the page structure and navigation.
*   `README.md`: This file.

## Prerequisites

*   Node.js and npm (or pnpm for frontend)
*   MongoDB server running (default connection URI: `mongodb://localhost:27017/hospital_app`)

## Setup and Running

1.  **Backend:**
    *   Navigate to the `/backend` directory: `cd backend`
    *   Install dependencies: `npm install`
    *   Create a `.env` file based on the existing one, ensuring `MONGODB_URI` points to your running MongoDB instance and `JWT_SECRET` is set to a strong secret key.
    *   Start the backend server: `node server.js` (It will run on port 3001 by default).
    *   **Note:** An admin user can be registered by sending a POST request to `/api/auth/register` (e.g., using curl or Postman) with `username`, `password`, and `role` (e.g., "Admin").

2.  **Frontend:**
    *   Navigate to the `/frontend` directory: `cd ../frontend`
    *   Install dependencies: `pnpm install` (or `npm install` if you prefer npm and have issues with pnpm).
    *   Start the frontend development server: `pnpm run dev` (It will run on port 5173 by default).
    *   Open your browser to `http://localhost:5173`.

## Current Status & Known Issues

*   This prototype includes:
    *   Login/Logout functionality with JWT authentication.
    *   Role-based navigation sidebar and basic dashboard.
    *   CRUD (Create, Read, Update, Delete) functionality for "Leave Types" (accessible via "Leave Config" in the sidebar for Admin users).
    *   Placeholder pages for other navigation items.
*   **Known Issue:** There is an unresolved issue with the `admin`/`password` login. If you encounter this, please check the backend console logs and browser network tab for specific error messages when attempting to log in. The user `admin` with password `password` should be creatable via the `/api/auth/register` endpoint.
*   The `zk-jubaer` library for DFACE702 integration is included in the backend dependencies, but the actual device connection logic in `backend/server.js` is commented out and requires configuration and testing with a real device.
*   Error handling and UI refinement are ongoing.
*   For production deployment, ensure CORS origins, database URIs, JWT secrets, and other configurations are properly set and secured.

