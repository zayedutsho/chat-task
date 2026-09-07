import axios from "axios";
import { ApiError, type ApiErrorDto } from "../../types/api";

const TOKEN_KEY = "chat-app.auth-token";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      throw new ApiError("Unable to save authentication token.", "TOKEN_STORAGE_ERROR");
    }
  },
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      throw new ApiError("Unable to clear authentication token.", "TOKEN_STORAGE_ERROR");
    }
  },
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError<ApiErrorDto>(error)) {
    const apiError = error.response?.data?.error;
    return new ApiError(
      typeof apiError?.message === "string"
        ? apiError.message
        : error.message || "Request failed.",
      typeof apiError?.code === "string"
        ? apiError.code
        : error.code || (error.response ? "HTTP_ERROR" : "NETWORK_ERROR"),
      error.response?.status,
    );
  }

  return new ApiError(
    error instanceof Error ? error.message : "An unexpected error occurred.",
    "UNKNOWN_ERROR",
  );
}

export const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://frontend-task-chatapp.onrender.com/api",
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
);