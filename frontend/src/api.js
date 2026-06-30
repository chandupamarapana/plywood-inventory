import axios from "axios";

const api = axios.create({
  baseURL: "https://plywood-inventory-backend.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/");
    const status = error.response?.status;

    // Only force logout on 403 if it's NOT an auth endpoint
    // and NOT a normal data validation error (400/404 should just show as error message)
    if (status === 403 && !isAuthEndpoint) {
      const hasToken = localStorage.getItem("token");
      if (!hasToken) {
        window.location.href = "/login";
      }
      // If we DO have a token but still got 403, it's likely a bad request
      // (e.g. malformed URL like /items/category/), not an auth failure.
      // Let the calling code handle the error instead of redirecting.
    }
    return Promise.reject(error);
  }
);

export default api;
