// src/api.js
import axios from 'axios';

const API_BASE_URL = "https://localhost:7189/api"; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    // 👇 WE CHANGED THIS TO MATCH THE LOGIN PAGE
    const token = localStorage.getItem("hospitalToken"); 
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;