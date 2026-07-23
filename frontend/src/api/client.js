// ============================================================
// client.js
// A single, reusable Axios instance for talking to the backend
// API. The base URL comes from the environment file (.env.staging
// or .env.production) so we NEVER hardcode IPs/URLs in code.
// ============================================================

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://192.168.1.131:8080/api
});

// ------------------------------------------------------------
// Automatically attach the saved JWT token (if any) to every
// outgoing request, so the user doesn't have to log in again
// on every page.
// ------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("nwroot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
