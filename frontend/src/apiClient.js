import axios from 'axios';

// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api', // Adjust this to match your backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors (e.g., 401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // Redirect to login or show auth error
            console.error('Authentication error');
            // Optional: localStorage.removeItem('token');
            // Optional: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions for shift types
export const shiftTypesApi = {
    getAll: () => apiClient.get('/shifts'),
    getById: (id) => apiClient.get(`/shifts/${id}`),
    create: (data) => apiClient.post('/shifts', data),
    update: (id, data) => apiClient.put(`/shifts/${id}`, data),
    delete: (id) => apiClient.delete(`/shifts/${id}`),
};

// API functions for schedules
export const schedulesApi = {
    getAll: (params) => apiClient.get('/schedules', { params }),
    getById: (id) => apiClient.get(`/schedules/${id}`),
    create: (data) => apiClient.post('/schedules', data),
    update: (id, data) => apiClient.put(`/schedules/${id}`, data),
    delete: (id) => apiClient.delete(`/schedules/${id}`),
    getMySchedule: (params) => apiClient.get('/schedules/my-schedule', { params }),
    getTeamSchedule: (params) => apiClient.get('/schedules/team-schedule', { params }),
};

export default apiClient;
