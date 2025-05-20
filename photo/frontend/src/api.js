import axios from "axios";

const API_BASE = "http://localhost:8000"; // Change if your backend URL is different

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // <--- ADD THIS LINE!
});

export default api;