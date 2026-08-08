import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from "axios";
import Cookies from "js-cookie";

// Backend origin (host[:port]). The Go backend serves all routes under /api,
// so we append "/api" unless NEXT_PUBLIC_API_BASE already includes it.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const TOKEN_EVENT = "gohublink:token-changed";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(ACCESS_TOKEN_KEY) || null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(REFRESH_TOKEN_KEY) || null;
}

function notifyTokenChanged() {
  window.dispatchEvent(new Event(TOKEN_EVENT));
  window.dispatchEvent(new Event("storage"));
}

export function setAuthTokens(accessToken: string, refreshToken: string | null) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    Cookies.remove(REFRESH_TOKEN_KEY);
  }
  notifyTokenChanged();
}

export function clearAuthTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  notifyTokenChanged();
}

export function subscribeTokenChanged(cb: () => void): () => void {
  window.addEventListener(TOKEN_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(TOKEN_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const axiosApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add Authorization header
axiosApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string> | null = null;

// Function to handle token expiration
const handleTokenExpiration = () => {
  clearAuthTokens();

  Cookies.set(
    "toastMessage",
    JSON.stringify({
      message: "Your session has expired.",
      description: "Please log in again.",
    }),
    { expires: 1 }
  );

  window.location.href = "/login";
};

// Refresh the access token with the stored refresh token (single-flight)
const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const token = response.data.access_token || response.data.token;
    const nextRefresh = response.data.refresh_token || refreshToken;
    setAuthTokens(token, nextRefresh);
    return token as string;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

// Response interceptor to handle token expiration on 401 errors
axiosApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const retryConfig = { ...originalRequest } as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle token expiration for authenticated routes, not login or refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest._retry
    ) {
      if (!getRefreshToken()) {
        handleTokenExpiration();
        return Promise.reject(error);
      }

      try {
        const token = await refreshAccessToken();
        retryConfig._retry = true;
        retryConfig.headers = {
          ...(originalRequest.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        };
        return axiosApi(retryConfig);
      } catch (refreshError) {
        handleTokenExpiration();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Extract the backend-provided error message from an Axios error
function toError(error: unknown, method: string): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  if (!error.response || error.response.status !== 401) {
    console.error(`${method} Request Error:`, error.message);
  }
  const data = error.response?.data as { error?: string } | undefined;
  return new Error(data?.error || error.message);
}

// Helper functions for HTTP methods
export async function get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.get<T>(url, { ...config });
    return response.data;
  } catch (error) {
    throw toError(error, "GET");
  }
}

export async function post<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.post<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    throw toError(error, "POST");
  }
}

export async function put<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.put<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    throw toError(error, "PUT");
  }
}

// Delete function (named 'del' to match your original)
export async function del<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.delete<T>(url, { ...config });
    return response.data;
  } catch (error) {
    throw toError(error, "DELETE");
  }
}

// Patch function
export async function patch<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosApi.patch<T>(url, data, { ...config });
    return response.data;
  } catch (error) {
    throw toError(error, "PATCH");
  }
}

// Download function for files with authentication
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await axiosApi.get(url, {
      responseType: "blob",
    });

    const contentType = response.headers["content-type"] ?? "application/octet-stream";
    const blob = new Blob([response.data], { type: contentType as string });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    throw toError(error, "DOWNLOAD");
  }
}

export default axiosApi;
export { API_URL };

export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  incharge_name: string;
  incharge_phone: string;
  idcard_type: string;
  idcard_name: string;
  idcard_dob: string;
  idcard_number: string;
  is_active: boolean;
  created_at: string;
}