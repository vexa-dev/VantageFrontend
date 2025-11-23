import axios from 'axios';

// URL de tu Backend Spring Boot
const API_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Antes de enviar cualquier petición, inyecta el Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Recuperamos el token guardado
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;