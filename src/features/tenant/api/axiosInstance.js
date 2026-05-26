import axios from "axios";
import { API_BASE_URL } from "../../../config/apiConfig";
import { ensureTenantContext } from "../context/tenantContext";


const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const PREFERRED_STORAGE_KEY = "auth_storage"; // "local" | "session"

function getPreferredStorage() {
    const pref = localStorage.getItem(PREFERRED_STORAGE_KEY);
    if (pref === "session") return sessionStorage;
    return localStorage;
}

function getAccessToken() {
    return (
        localStorage.getItem(ACCESS_TOKEN_KEY) ||
        sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
}

function getRefreshToken() {
    return (
        localStorage.getItem(REFRESH_TOKEN_KEY) ||
        sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
}

function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function setAccessToken(token) {
    const storage = getPreferredStorage();
    storage.setItem(ACCESS_TOKEN_KEY, token);
}

let refreshPromise = null;

function isAuthEndpoint(url = "") {
    return url.includes("/api/v1/auth/login/") || url.includes("/api/v1/auth/refresh/");
}


// Request interceptor to attach access token
axiosInstance.interceptors.request.use(async (config) => {
    const tenant = await ensureTenantContext();
    if (!tenant?.id) {
        throw new Error("Tenant context is not resolved.");
    }

    config.headers["X-Tenant-ID"] = tenant.id;

    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set multipart boundary for file uploads
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// Response interceptor to handle token expiration and refresh
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";
        const refreshToken = getRefreshToken();

        // Do not attempt token refresh on auth endpoints (login/refresh),
        // or when no refresh token exists.
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isAuthEndpoint(requestUrl) &&
            refreshToken
        ) {
            originalRequest._retry = true;

            try {
                // Single-flight refresh: if multiple requests 401 together, only refresh once.
                if (!refreshPromise) {
                    const tenant = await ensureTenantContext();
                    refreshPromise = axios
                        .post(
                            `${axiosInstance.defaults.baseURL}/api/v1/auth/refresh/`,
                            { refresh: refreshToken },
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Tenant-ID": tenant?.id,
                                },
                            }
                        )
                        .then((res) => res.data)
                        .finally(() => {
                            refreshPromise = null;
                        });
                }

                const refreshed = await refreshPromise;
                const access = refreshed?.access || refreshed?.token;
                if (!access) {
                    throw new Error("Refresh succeeded but no access token returned");
                }

                setAccessToken(access);

                // Update the original request header and retry
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and logout
                console.error("Refresh token failed:", refreshError);
                clearTokens();
                window.location.href = "/tenant/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;