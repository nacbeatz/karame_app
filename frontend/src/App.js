import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the backend Socket.IO server
// Make sure the backend server is running and accessible
// Use the actual backend URL in a real deployment
const SOCKET_SERVER_URL = 'http://localhost:3001'; // Assuming backend runs on port 3001

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    // Listen for general server messages (example)
    socket.on('server_message', (data) => {
      console.log('Message from server:', data);
      setLastMessage(data.message);
    });

    // Listen for real-time attendance updates
    socket.on('attendance_update', (data) => {
      console.log('Attendance update received:', data);
      // Add new attendance event to the beginning of the log
      setAttendanceLog(prevLog => [data, ...prevLog]);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hospital Workforce Management</h1>
        <p>Socket.IO Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        {lastMessage && <p>Last Server Message: {lastMessage}</p>}
        <h2>Real-time Attendance Log (Simulated)</h2>
        <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', marginTop: '10px', textAlign: 'left', padding: '10px' }}>
          {attendanceLog.length === 0 ? (
            <p>Waiting for attendance events...</p>
          ) : (
            <ul>
              {attendanceLog.map((log, index) => (
                <li key={index}>
                  {new Date(log.timestamp).toLocaleString()} - User: {log.userId} - Action: {log.type}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

