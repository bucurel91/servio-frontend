import axios from "axios";

const BASE_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export function setBaseUrl(url: string) {
  apiClient.defaults.baseURL = url;
}

// Attach Firebase ID token to every request.
// Call setTokenProvider() once on app startup with a function
// that returns the current user's token (from Firebase Auth SDK).
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  getToken = fn;
}

apiClient.interceptors.request.use(async (config) => {
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});