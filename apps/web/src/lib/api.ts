import axios from "axios";

export const api = axios.create({
  baseURL: process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001",
  withCredentials: true,
  timeout: 15_000,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001"}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.data.accessToken);
        originalRequest.headers["Authorization"] = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
