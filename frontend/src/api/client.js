// SmartRent Unified API Client

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://smartrent-vehicle-rental.onrender.com");

export function getAuthToken() {
  try {
    return localStorage.getItem("smartrentToken") || "";
  } catch {
    return "";
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("smartrentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // 12-second default timeout to prevent UI freezes on hung connections
  let fallbackController = null;
  let signal = options.signal;
  if (!signal) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      signal = AbortSignal.timeout(12000);
    } else {
      fallbackController = new AbortController();
      signal = fallbackController.signal;
      setTimeout(() => fallbackController.abort(), 12000);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal,
    });
  } catch (netErr) {
    if (netErr.name === "AbortError") {
      throw new Error("Request timed out. Please check your backend connection.");
    }
    throw new Error(
      `Network connection error: Unable to reach SmartRent server at ${url}. Please ensure backend is running.`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/csv")) {
    const text = await response.text();
    if (!response.ok) throw new Error("Failed to download CSV.");
    return text;
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  // Vehicles
  getVehicles: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/api/vehicles${qs ? `?${qs}` : ""}`);
  },

  getVehicleById: (id) => request(`/api/vehicles/${id}`),

  getTopRatedVehicles: (limit = 6) =>
    request(`/api/vehicles/top-rated?limit=${limit}`),

  getRecommendations: (userId, limit = 4) =>
    request(`/api/vehicles/recommendations/${userId}?limit=${limit}`),

  createVehicle: (payload) =>
    request("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateVehicle: (id, payload) =>
    request(`/api/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateVehicleRate: (id, pricePerDay) =>
    request(`/api/vehicles/${id}/rate`, {
      method: "PATCH",
      body: JSON.stringify({ pricePerDay }),
    }),

  deleteVehicle: (id) =>
    request(`/api/vehicles/${id}`, {
      method: "DELETE",
    }),

  // Bookings
  createBooking: (payload) =>
    request("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUserBookings: (userId, status) => {
    const qs = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/api/bookings/user/${userId}${qs}`);
  },

  cancelBooking: (bookingId, userId) =>
    request(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getAdminBookings: () => request("/api/bookings/admin/all"),

  updateBookingStatus: (bookingId, status) =>
    request(`/api/bookings/admin/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteAdminBooking: (bookingId) =>
    request(`/api/bookings/admin/${bookingId}`, {
      method: "DELETE",
    }),

  // Analytics & Dashboard
  getDashboardOverview: () => request("/api/dashboard"),

  getAnalytics: (period = "last30days", startDate = "", endDate = "") => {
    const qs = new URLSearchParams({ period });
    if (startDate) qs.append("startDate", startDate);
    if (endDate) qs.append("endDate", endDate);
    return request(`/api/dashboard/analytics?${qs.toString()}`);
  },

  getVehiclePerformance: (period = "last30days", options = {}) => {
    const qs = new URLSearchParams({ period });
    if (options.startDate) qs.append("startDate", options.startDate);
    if (options.endDate) qs.append("endDate", options.endDate);
    if (options.sort) qs.append("sort", options.sort);
    if (options.order) qs.append("order", options.order);
    return request(`/api/dashboard/vehicle-performance?${qs.toString()}`);
  },

  exportCSV: async (period = "last30days", type = "bookings", startDate = "", endDate = "") => {
    const qs = new URLSearchParams({ period, type });
    if (startDate) qs.append("startDate", startDate);
    if (endDate) qs.append("endDate", endDate);
    return request(`/api/dashboard/export?${qs.toString()}`);
  },

  // Ratings
  submitRating: (vehicleId, userId, rating) =>
    request(`/api/vehicles/${vehicleId}/rating`, {
      method: "POST",
      body: JSON.stringify({ userId, rating }),
    }),

  // Notifications
  getNotifications: (userId, options = {}) =>
    request(`/api/notifications/${userId}`, options),

  markNotificationRead: (notificationId) =>
    request(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  // Feedback
  submitFeedback: (message) =>
    request("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getAdminFeedback: () => request("/api/feedback/admin/all"),

  replyFeedback: (feedbackId, reply) =>
    request(`/api/feedback/admin/${feedbackId}/reply`, {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    }),

  markFeedbackRead: (feedbackId) =>
    request(`/api/feedback/admin/${feedbackId}/read`, {
      method: "PATCH",
    }),

  // Pricing History
  getPricingHistory: () => request("/api/pricing-history"),

  // AI Vehicle Search
  aiSearch: (prompt) =>
    request("/api/ai-search", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
