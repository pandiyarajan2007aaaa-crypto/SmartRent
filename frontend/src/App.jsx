import { useEffect, useState } from "react";

import {

  CarFront,

  Search,

  MapPin,

  CalendarDays,

  UserRound,

  Menu,

  Users,

  Fuel,

  Settings,

  X,

  Star,

  ArrowRight,

  ShieldCheck,

  Clock,

  History,
  Headphones,
  Trash2,
  Bell,

} from "lucide-react";



import "./App.css";



function App() {

  const [search, setSearch] = useState("");

  const [pricingHistory, setPricingHistory] = useState([]);
  const [pricingHistoryLoading, setPricingHistoryLoading] = useState(false);

  const [category, setCategory] = useState("All");

  const [brandFilter, setBrandFilter] = useState("All");

  const [fuelFilter, setFuelFilter] = useState("All");

  const [availabilityFilter, setAvailabilityFilter] = useState("All");



  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [location, setLocation] = useState("");

  const [pickupDate, setPickupDate] = useState("");

  const [returnDate, setReturnDate] = useState("");

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResults, setAiResults] = useState(null);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);
  const [adminBookingsError, setAdminBookingsError] = useState("");
  const [bookingStatusDrafts, setBookingStatusDrafts] = useState({});
  const [bookingStatusSavingId, setBookingStatusSavingId] = useState("");
  const [bookingDeletingId, setBookingDeletingId] = useState("");
  const [bookingStatusMessage, setBookingStatusMessage] = useState({ type: "", text: "" });
  const [searchMessage, setSearchMessage] = useState("");
  const [rateDrafts, setRateDrafts] = useState({});
  const [rateSavingId, setRateSavingId] = useState("");
  const [rateMessages, setRateMessages] = useState({});
  const [topRatedVehicles, setTopRatedVehicles] = useState([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [customerRatings, setCustomerRatings] = useState({});
  const [ratingSavingId, setRatingSavingId] = useState("");
  const [ratingMessages, setRatingMessages] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationUpdatingId, setNotificationUpdatingId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({ type: "", text: "" });
  const [showFeedback, setShowFeedback] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminFeedbackLoading, setAdminFeedbackLoading] = useState(false);
  const [adminFeedbackError, setAdminFeedbackError] = useState("");
  const [feedbackUpdatingId, setFeedbackUpdatingId] = useState("");
  const [feedbackReplyDrafts, setFeedbackReplyDrafts] = useState({});
  const [feedbackReplySavingId, setFeedbackReplySavingId] = useState("");
  const [feedbackReplyMessages, setFeedbackReplyMessages] = useState({});
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);



  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Authentication state
  const [authMode, setAuthMode] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartrentUser") || "null");
    } catch {
      return null;
    }
  });



  // Fetch vehicles from MongoDB through backend API

  useEffect(() => {

    const fetchVehicles = async () => {

      try {

        const response = await fetch(

          "https://smartrent-qgo8.onrender.com/api/vehicles"

        );



        if (!response.ok) {

          throw new Error(

            "Unable to load vehicles. Please try again."

          );

        }



        const data = await response.json();



        if (!data.success || !Array.isArray(data.vehicles)) {

          throw new Error(

            "Invalid vehicle data received from server."

          );

        }



        setVehicles(

          data.vehicles.map((vehicle) => ({

            ...vehicle,

            id: vehicle._id,

            price: Number(

              vehicle.pricePerDay ?? vehicle.price ?? 0

            ),

            seats: vehicle.seats ?? 5,

            fuel: vehicle.fuel ?? "Not specified",

            transmission:

              vehicle.transmission ?? "Not specified",

            rating: vehicle.rating ?? 0,

            description:

              vehicle.description ??

              "Vehicle details will be updated soon.",

            image:

              vehicle.image ||

              "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle",

            available: vehicle.available ?? true,

          }))

        );

      } catch (err) {

        setError(

          err.message ||

            "Something went wrong while loading vehicles."

        );

      } finally {

        setLoading(false);

      }

    };



    fetchVehicles();

  }, []);



  // Fetch vehicles with customer ratings for the Top-Rated section.
  useEffect(() => {
    const fetchTopRatedVehicles = async () => {
      setTopRatedLoading(true);
      try {
        const response = await fetch("https://smartrent-qgo8.onrender.com/api/vehicles/top-rated?limit=5");
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Unable to load top-rated vehicles.");
        }
        setTopRatedVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      } catch (err) {
        console.error("Top-rated vehicles error:", err);
        setTopRatedVehicles([]);
      } finally {
        setTopRatedLoading(false);
      }
    };
    fetchTopRatedVehicles();
  }, []);

  // Fetch dashboard statistics only after admin login.
  useEffect(() => {
    const fetchDashboard = async () => {
      if (loggedInUser?.role !== "admin") {
        setDashboard(null);
        setDashboardError("");
        setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);
      setDashboardError("");
      try {
        const token = localStorage.getItem("smartrentToken");
        const response = await fetch("https://smartrent-qgo8.onrender.com/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load dashboard statistics.");
        }
        setDashboard(data.dashboard || null);
      } catch (err) {
        setDashboardError(err.message || "Unable to load dashboard statistics.");
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [loggedInUser]);

  // Fetch all bookings for the admin dashboard.
  useEffect(() => {
    if (loggedInUser?.role !== "admin") {
      setAdminBookings([]);
      setAdminBookingsError("");
      return;
    }
    fetchAdminBookings();
  }, [loggedInUser]);

  // Fetch pricing history only after admin login.
  useEffect(() => {
    if (loggedInUser?.role !== "admin") {
      setPricingHistory([]);
      setPricingHistoryLoading(false);
      return;
    }

    fetchPricingHistory();
  }, [loggedInUser]);

  // Fetch customer feedback only after admin login.
  useEffect(() => {
    if (loggedInUser?.role !== "admin") {
      setAdminFeedback([]);
      setAdminFeedbackError("");
      return;
    }
    fetchAdminFeedback();
  }, [loggedInUser]);

  // Search and category filters

  const filteredVehicles = (aiResults !== null ? aiResults : vehicles).filter((vehicle) => {

    const searchText = search.trim().toLowerCase();



    const matchesSearch =

      vehicle.name.toLowerCase().includes(searchText) ||

      (vehicle.brand || "")

        .toLowerCase()

        .includes(searchText) ||

      (vehicle.type || "")

        .toLowerCase()

        .includes(searchText);



    const matchesCategory =

      category === "All" || vehicle.type === category;



    const matchesBrand =

      brandFilter === "All" ||

      vehicle.brand === brandFilter;



    const matchesFuel =

      fuelFilter === "All" ||

      vehicle.fuel === fuelFilter;



    const matchesAvailability =

      availabilityFilter === "All" ||

      (availabilityFilter === "Available" &&

        vehicle.available) ||

      (availabilityFilter === "Unavailable" &&

        !vehicle.available);



    return (

      matchesSearch &&

      matchesCategory &&

      matchesBrand &&

      matchesFuel &&

      matchesAvailability

    );

  });



  // Main vehicle search

  const handleSearch = () => {

    if (!location.trim() || !pickupDate || !returnDate) {
      setSearchMessage("Please enter location and both rental dates.");
      return;
    }

    if (new Date(returnDate) <= new Date(pickupDate)) {
      setSearchMessage("Return date must be after pickup date.");
      return;
    }

    setSearchMessage("");
    document.getElementById("vehicles")?.scrollIntoView({

      behavior: "smooth",

    });

  };



  // AI vehicle search using the backend Groq integration
  const handleAIsearch = async () => {
    const prompt = aiQuery.trim();

    if (!prompt) {
      setAiError("Please describe the vehicle you need.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiResults(null);

    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "AI search failed. Please try again.");
      }

      const matchedVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
      setAiResults(
        matchedVehicles.map((vehicle) => ({
          ...vehicle,
          id: vehicle._id || vehicle.id,
          price: Number(vehicle.pricePerDay ?? vehicle.price ?? 0),
          seats: vehicle.seats ?? 5,
          fuel: vehicle.fuel ?? "Not specified",
          transmission: vehicle.transmission ?? "Not specified",
          rating: vehicle.rating ?? 0,
          description: vehicle.description ?? "Vehicle details will be updated soon.",
          image: vehicle.image || "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle",
          available: vehicle.available ?? true,
        }))
      );

      // Reset manual filters so AI results are not hidden by previous filters.
      setSearch("");
      setCategory("All");
      setBrandFilter("All");
      setFuelFilter("All");
      setAvailabilityFilter("All");

      document.getElementById("vehicles")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setAiError(err.message || "Unable to connect to AI search.");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAISearch = () => {
    setAiResults(null);
    setAiError("");
    setAiQuery("");
  };

  // Open booking modal

  const handleBooking = (vehicle) => {

    setBookingError("");
    setBookingVehicle(vehicle);

    setSelectedVehicle(null);

  };



  // Submit booking request to the backend
  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!loggedInUser) {
      setBookingVehicle(null);
      setAuthMode("login");
      setAuthMessage("Please log in before booking a vehicle.");
      return;
    }

    if (!bookingVehicle) {
      setBookingError("Please select a vehicle.");
      return;
    }

    if (!pickupDate || !returnDate || !location.trim()) {
      setBookingError("Please enter your location and rental dates.");
      return;
    }

    if (new Date(returnDate) <= new Date(pickupDate)) {
      setBookingError("Return date must be after pickup date.");
      return;
    }

    const userId = loggedInUser._id || loggedInUser.id;
    const vehicleId = bookingVehicle._id || bookingVehicle.id;

    if (!userId || !vehicleId) {
      setBookingError("User ID or vehicle ID is missing. Please log in again and retry.");
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          vehicleId,
          pickupDate,
          returnDate,
          location: location.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to create booking.");
      }

      const booking = data.booking || {};
      const totalAmount = booking.totalAmount ??
        (Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) *
          Number(bookingVehicle.pricePerDay ?? bookingVehicle.price ?? 0));

      setBookingSuccess({
        ...booking,
        vehicleName: bookingVehicle.name,
        vehicleBrand: bookingVehicle.brand,
        pickupDate,
        returnDate,
        location: location.trim(),
        totalAmount,
      });
      setBookingVehicle(null);
      setLocation("");
      setPickupDate("");
      setReturnDate("");
    } catch (err) {
      setBookingError(err.message || "Unable to connect to the booking server.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    try {
      const endpoint = authMode === "register" ? "register" : "login";
      const payload = authMode === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };

      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMessage("Registration successful! Please log in.");
        setAuthMode("login");
        setAuthForm({ name: "", email: authForm.email, password: "" });
        return;
      }

      localStorage.setItem("smartrentToken", data.token);
      localStorage.setItem("smartrentUser", JSON.stringify(data.user));
      setLoggedInUser(data.user);
      setAuthMode("");
      setAuthForm({ name: "", email: "", password: "" });
    } catch (err) {
      setAuthMessage(err.message || "Unable to connect to the server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchNotifications = async (openModal = true) => {
    const userId = loggedInUser?._id || loggedInUser?.id;
    const token = localStorage.getItem("smartrentToken");

    if (!userId || !token) {
      setNotificationsError("Please log in to view notifications.");
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");
    if (openModal) setShowNotifications(true);

    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load notifications.");
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      setNotificationsError(err.message || "Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    const token = localStorage.getItem("smartrentToken");

    if (!token) {
      setNotificationsError("Please log in again.");
      return;
    }

    setNotificationUpdatingId(notificationId);
    setNotificationsError("");

    try {
      const response = await fetch(
        `https://smartrent-qgo8.onrender.com/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      setNotificationsError(err.message || "Unable to update notification.");
    } finally {
      setNotificationUpdatingId("");
    }
  };

  // Refresh customer notifications after login so the bell badge
  // can show a new SmartRent reply without opening the bell first.
  useEffect(() => {
    if (loggedInUser?.role === "admin") {
      setNotifications([]);
      return;
    }

    if (loggedInUser) {
      fetchNotifications(false);
    } else {
      setNotifications([]);
    }
  }, [loggedInUser]);

  const fetchMyBookings = async () => {
    if (!loggedInUser) {
      setAuthMessage("Please log in to view your bookings.");
      setAuthMode("login");
      return;
    }

    const userId = loggedInUser._id || loggedInUser.id;
    setBookingsLoading(true);
    setBookingsError("");
    setShowMyBookings(true);
    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/bookings/user/${userId}`);
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to fetch bookings.");
      }
      setMyBookings(data.bookings || []);
    } catch (err) {
      setBookingsError(err.message || "Unable to fetch bookings.");
    } finally {
      setBookingsLoading(false);
    }
  };

  // Submit one rating per completed rental booking.
  const submitVehicleRating = async (bookingId, vehicleId, rating) => {
    const userId = loggedInUser?._id || loggedInUser?.id;
    if (!userId) {
      setRatingMessages((current) => ({ ...current, [bookingId]: { type: "error", text: "Please log in again before submitting a rating." } }));
      return;
    }
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      setRatingMessages((current) => ({ ...current, [bookingId]: { type: "error", text: "Please select 1 to 5 stars." } }));
      return;
    }

    setRatingSavingId(bookingId);
    setRatingMessages((current) => ({ ...current, [bookingId]: { type: "info", text: "Submitting your rating..." } }));
    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/vehicles/${vehicleId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bookingId, rating: numericRating }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to submit rating.");
      }
      setRatingMessages((current) => ({ ...current, [bookingId]: { type: "success", text: "Thank you! Your rating has been submitted. You cannot rate this rental again." } }));
      setMyBookings((current) => current.map((booking) =>
        (booking._id || booking.id) === bookingId ? { ...booking, hasRated: true } : booking
      ));
      if (data.rating !== undefined) {
        setVehicles((current) => current.map((vehicle) =>
          (vehicle._id || vehicle.id) === vehicleId ? { ...vehicle, rating: data.rating } : vehicle
        ));
      }
      const topResponse = await fetch("https://smartrent-qgo8.onrender.com/api/vehicles/top-rated?limit=5");
      const topData = await topResponse.json().catch(() => ({}));
      if (topResponse.ok && topData.success !== false && Array.isArray(topData.vehicles)) {
        setTopRatedVehicles(topData.vehicles);
      }
    } catch (err) {
      setRatingMessages((current) => ({ ...current, [bookingId]: { type: "error", text: err.message || "Unable to submit rating." } }));
    } finally {
      setRatingSavingId("");
    }
  };

  // Admin: fetch pricing history.
  const fetchPricingHistory = async () => {
    if (loggedInUser?.role !== "admin") return;

    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setPricingHistory([]);
      return;
    }

    setPricingHistoryLoading(true);

    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/pricing-history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch pricing history.");
      }

      setPricingHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      console.error("Pricing history fetch error:", err);
      setPricingHistory([]);
    } finally {
      setPricingHistoryLoading(false);
    }
  };

  // Admin: fetch all bookings for status management.
  const fetchAdminBookings = async () => {
    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setAdminBookingsError("Please log in again as admin.");
      return;
    }

    setAdminBookingsLoading(true);
    setAdminBookingsError("");
    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/bookings/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch bookings.");
      }
      const items = Array.isArray(data.bookings) ? data.bookings : [];
      setAdminBookings(items);
      setBookingStatusDrafts((current) => {
        const next = { ...current };
        items.forEach((booking) => {
          if (next[booking._id] === undefined) next[booking._id] = booking.status || "Pending";
        });
        return next;
      });
    } catch (err) {
      setAdminBookingsError(err.message || "Unable to fetch bookings.");
    } finally {
      setAdminBookingsLoading(false);
    }
  };

  // Admin: update a booking status.
  const updateBookingStatus = async (bookingId) => {
    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setBookingStatusMessage({ type: "error", text: "Please log in again as admin." });
      return;
    }

    const status = bookingStatusDrafts[bookingId];
    setBookingStatusSavingId(bookingId);
    setBookingStatusMessage({ type: "", text: "" });
    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/bookings/admin/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update booking status.");
      }

      setAdminBookings((current) => current.map((booking) =>
        booking._id === bookingId ? { ...booking, ...(data.booking || {}), status } : booking
      ));
      setDashboard((current) => current ? {
        ...current,
        recentBookings: (current.recentBookings || []).map((booking) =>
          booking._id === bookingId ? { ...booking, status } : booking
        ),
      } : current);
      setBookingStatusMessage({ type: "success", text: data.message || "Booking status updated successfully." });
      // Refresh dashboard counts after the booking status changes.
      const dashboardResponse = await fetch("https://smartrent-qgo8.onrender.com/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardResponse.json().catch(() => ({}));
      if (dashboardResponse.ok && dashboardData.success) setDashboard(dashboardData.dashboard || null);
      // Keep the vehicle cards in sync with the booking status.
      const vehicle = adminBookings.find((booking) => booking._id === bookingId)?.vehicle;
      if (vehicle?._id) {
        const isAvailable = ["Cancelled", "Returned", "Completed"].includes(status);
        setVehicles((current) => current.map((item) =>
          (item._id || item.id) === vehicle._id ? { ...item, available: isAvailable } : item
        ));
      }
    } catch (err) {
      setBookingStatusMessage({ type: "error", text: err.message || "Unable to update booking status." });
    } finally {
      setBookingStatusSavingId("");
    }
  };

  // Admin: delete a booking.
  const deleteAdminBooking = async (bookingId) => {
    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setBookingStatusMessage({ type: "error", text: "Please log in again as admin." });
      return;
    }

    setBookingDeletingId(bookingId);
    setBookingStatusMessage({ type: "", text: "" });
    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/bookings/admin/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete booking.");
      }

      setAdminBookings((current) => current.filter((booking) => booking._id !== bookingId));
      setBookingStatusDrafts((current) => {
        const next = { ...current };
        delete next[bookingId];
        return next;
      });
      setDashboard((current) => current ? {
        ...current,
        recentBookings: (current.recentBookings || []).filter((booking) => booking._id !== bookingId),
      } : current);
      setBookingStatusMessage({ type: "success", text: data.message || "Booking deleted successfully." });

      const dashboardResponse = await fetch("https://smartrent-qgo8.onrender.com/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardResponse.json().catch(() => ({}));
      if (dashboardResponse.ok && dashboardData.success) {
        setDashboard(dashboardData.dashboard || null);
      }

      if (data.vehicleId) {
        setVehicles((current) => current.map((item) =>
          (item._id || item.id) === data.vehicleId ? { ...item, available: data.vehicleAvailable } : item
        ));
      }
    } catch (err) {
      setBookingStatusMessage({ type: "error", text: err.message || "Unable to delete booking." });
    } finally {
      setBookingDeletingId("");
    }
  };

  // Admin-only vehicle rate management
  const updateVehicleRate = async (vehicleId, newRate) => {
    if (loggedInUser?.role !== "admin") {
      setRateMessages((current) => ({ ...current, [vehicleId]: { type: "error", text: "Only admin can update vehicle rates." } }));
      return;
    }

    const pricePerDay = Number(newRate);
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
      setRateMessages((current) => ({ ...current, [vehicleId]: { type: "error", text: "Enter a valid rate greater than zero." } }));
      return;
    }

    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setRateMessages((current) => ({ ...current, [vehicleId]: { type: "error", text: "Please log in again as admin." } }));
      return;
    }

    setRateSavingId(vehicleId);
    setRateMessages((current) => ({ ...current, [vehicleId]: null }));
    try {
      const response = await fetch(
        `https://smartrent-qgo8.onrender.com/api/vehicles/${vehicleId}/rate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pricePerDay }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update vehicle rate.");
      }

      const updatedRate = Number(data.vehicle?.pricePerDay ?? pricePerDay);
      setVehicles((current) =>
        current.map((vehicle) =>
          (vehicle._id || vehicle.id) === vehicleId
            ? { ...vehicle, price: updatedRate, pricePerDay: updatedRate }
            : vehicle
        )
      );
      setRateDrafts((current) => ({ ...current, [vehicleId]: String(updatedRate) }));
      if (selectedVehicle && (selectedVehicle._id || selectedVehicle.id) === vehicleId) {
        setSelectedVehicle((current) =>
          current ? { ...current, price: updatedRate, pricePerDay: updatedRate } : current
        );
      }
      setRateMessages((current) => ({ ...current, [vehicleId]: { type: "success", text: "Rate updated successfully." } }));
    } catch (err) {
      setRateMessages((current) => ({ ...current, [vehicleId]: { type: "error", text: err.message || "Unable to update vehicle rate." } }));
    } finally {
      setRateSavingId("");
    }
  };

  // Customer: submit feedback to admin.
  const submitFeedback = async (e) => {
    e.preventDefault();

    if (!loggedInUser || loggedInUser?.role === "admin") {
      setFeedbackStatus({ type: "error", text: "Please log in as a customer to send feedback." });
      return;
    }

    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackStatus({ type: "error", text: "Please enter your feedback message." });
      return;
    }

    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setFeedbackStatus({ type: "error", text: "Please log in again before sending feedback." });
      return;
    }

    setFeedbackSending(true);
    setFeedbackStatus({ type: "info", text: "Sending feedback..." });

    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          name: loggedInUser.name,
          email: loggedInUser.email,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to submit feedback.");
      }

      setFeedbackMessage("");
      setFeedbackStatus({ type: "success", text: data.message || "Feedback submitted successfully." });
    } catch (err) {
      setFeedbackStatus({ type: "error", text: err.message || "Unable to submit feedback." });
    } finally {
      setFeedbackSending(false);
    }
  };

  // Admin: fetch all customer feedback.
  const fetchAdminFeedback = async () => {
    if (loggedInUser?.role !== "admin") return;

    const token = localStorage.getItem("smartrentToken");
    if (!token) {
      setAdminFeedbackError("Please log in again as admin.");
      return;
    }

    setAdminFeedbackLoading(true);
    setAdminFeedbackError("");

    try {
      const response = await fetch("https://smartrent-qgo8.onrender.com/api/feedback/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch customer feedback.");
      }

      setAdminFeedback(Array.isArray(data.feedback) ? data.feedback : []);
    } catch (err) {
      setAdminFeedbackError(err.message || "Unable to fetch customer feedback.");
      setAdminFeedback([]);
    } finally {
      setAdminFeedbackLoading(false);
    }
  };

  // Admin: mark a feedback message as read.
  const markFeedbackRead = async (feedbackId) => {
    const token = localStorage.getItem("smartrentToken");
    if (!token) return;

    setFeedbackUpdatingId(feedbackId);
    try {
      const response = await fetch(`https://smartrent-qgo8.onrender.com/api/feedback/admin/${feedbackId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to mark feedback as read.");
      }

      setAdminFeedback((current) => current.map((item) =>
        item._id === feedbackId ? { ...item, isRead: true } : item
      ));
    } catch (err) {
      setAdminFeedbackError(err.message || "Unable to update feedback.");
    } finally {
      setFeedbackUpdatingId("");
    }
  };

  // Admin: send a reply to a customer feedback message.
  const sendFeedbackReply = async (feedbackId) => {
    const token = localStorage.getItem("smartrentToken");
    const reply = (feedbackReplyDrafts[feedbackId] || "").trim();

    if (!token) {
      setAdminFeedbackError("Please log in again as admin.");
      return;
    }

    if (!reply) {
      setFeedbackReplyMessages((current) => ({
        ...current,
        [feedbackId]: { type: "error", text: "Please enter a reply message." },
      }));
      return;
    }

    setFeedbackReplySavingId(feedbackId);
    setFeedbackReplyMessages((current) => ({
      ...current,
      [feedbackId]: { type: "info", text: "Sending reply..." },
    }));

    try {
      const response = await fetch(
        `https://smartrent-qgo8.onrender.com/api/feedback/admin/${feedbackId}/reply`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send reply.");
      }

      setAdminFeedback((current) =>
        current.map((item) =>
          item._id === feedbackId
            ? {
                ...item,
                ...(data.feedback || {}),
                reply,
                isReplied: true,
                repliedAt: data.feedback?.repliedAt || new Date().toISOString(),
              }
            : item
        )
      );

      setFeedbackReplyDrafts((current) => ({
        ...current,
        [feedbackId]: "",
      }));

      setFeedbackReplyMessages((current) => ({
        ...current,
        [feedbackId]: {
          type: "success",
          text: "Reply sent successfully from SmartRent.",
        },
      }));
    } catch (err) {
      setFeedbackReplyMessages((current) => ({
        ...current,
        [feedbackId]: {
          type: "error",
          text: err.message || "Unable to send reply.",
        },
      }));
    } finally {
      setFeedbackReplySavingId("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("smartrentToken");
    localStorage.removeItem("smartrentUser");
    setLoggedInUser(null);
  };

  // Group all feedback from the same customer into one continuous private chat.
  // This prevents the same customer from appearing as a new row for every message.
  const getFeedbackCustomerKey = (item) =>
    String(
      item?.user?._id ||
      item?.user?.id ||
      item?.user ||
      item?.email ||
      item?.name ||
      "customer"
    ).toLowerCase();

  const feedbackCustomerGroups = Object.values(
    adminFeedback.reduce((groups, item) => {
      const key = getFeedbackCustomerKey(item);

      if (!groups[key]) {
        groups[key] = {
          key,
          name: item.user?.name || item.name || "Customer",
          items: [],
        };
      }

      groups[key].items.push(item);
      return groups;
    }, {})
  )
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.items[b.items.length - 1]?.createdAt || 0) -
        new Date(a.items[a.items.length - 1]?.createdAt || 0)
    );

  return (

    <div className="app">
      <style>{`
        /* SmartRent layout polish */
        .navbar {
          box-sizing: border-box !important;
          width: 100% !important;
          min-height: 82px !important;
          height: auto !important;
          padding: 14px clamp(18px, 4vw, 56px) !important;
          display: grid !important;
          grid-template-columns: max-content minmax(0, 1fr) max-content !important;
          align-items: center !important;
          column-gap: clamp(16px, 2.4vw, 38px) !important;
          row-gap: 12px !important;
          position: relative;
          z-index: 20;
        }
        .navbar .logo { white-space: nowrap !important; flex-shrink: 0 !important; }
        .nav-links {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: clamp(14px, 2.2vw, 34px) !important;
          min-width: 0 !important;
          flex-wrap: nowrap !important;
        }
        .nav-links a { white-space: nowrap !important; font-size: 15px !important; }
        .nav-actions {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 9px !important;
          min-width: 0 !important;
          flex-wrap: nowrap !important;
        }
        .nav-actions .login-btn, .nav-actions .register-btn {
          box-sizing: border-box !important;
          min-height: 44px !important;
          height: 44px !important;
          border-radius: 12px !important;
          font-size: 14px !important;
        }
        .nav-actions button[aria-label="Notifications"] {
          width: 44px !important; min-width: 44px !important; height: 44px !important;
          padding: 0 !important; display: inline-flex !important;
          align-items: center !important; justify-content: center !important;
        }
        .nav-actions button[aria-label="Notifications"] svg {
          width: 20px !important; height: 20px !important; display: block !important;
        }
        .hero { min-height: 610px; }
        .hero-content { width: min(100% - 36px, 900px) !important; margin-inline: auto !important; }
        .hero-content h1 { font-size: clamp(42px, 5.2vw, 68px) !important; line-height: 1.08 !important; letter-spacing: -1.5px !important; }
        .hero-content p { max-width: 650px; margin-inline: auto; line-height: 1.7 !important; }
        .modal-overlay { z-index: 1000 !important; }
        @media (max-width: 1120px) {
          .navbar { grid-template-columns: max-content minmax(0, 1fr) max-content !important; column-gap: 12px !important; padding-inline: 20px !important; }
          .nav-links { gap: 12px !important; }
          .nav-links a { font-size: 13px !important; }
          .nav-actions { gap: 6px !important; }
          .nav-actions .login-btn, .nav-actions .register-btn { padding-inline: 12px !important; }
        }
        @media (max-width: 850px) {
          .navbar { display: flex !important; flex-wrap: wrap !important; justify-content: space-between !important; }
          .navbar .logo { margin-right: auto; }
          .navbar .menu-btn { display: inline-flex !important; align-items: center; justify-content: center; }
          .nav-links { display: none !important; }
          .nav-links.show-menu {
            display: flex !important; order: 4; width: 100%; flex-direction: column !important;
            align-items: stretch !important; gap: 0 !important; padding: 8px 0 4px;
          }
          .nav-links.show-menu a { padding: 12px 8px; }
          .nav-actions { margin-left: auto; }
        }
        @media (max-width: 520px) {
          .navbar { padding: 12px 14px !important; }
          .navbar .logo { font-size: 21px !important; }
          .nav-actions { gap: 5px !important; }
          .nav-actions .login-btn, .nav-actions .register-btn { min-height: 38px !important; height: 38px !important; padding-inline: 9px !important; font-size: 12px !important; }
          .nav-actions button[aria-label="Notifications"] { width: 38px !important; min-width: 38px !important; height: 38px !important; }
          .nav-actions > span.login-btn { max-width: 42px !important; padding-inline: 10px !important; }
          .nav-actions > span.login-btn span { display: none !important; }
          .hero { min-height: 560px; }
          .hero-content h1 { font-size: clamp(36px, 10vw, 48px) !important; }
        }
      `}</style>

      {/* NAVBAR */}

      <nav className="navbar">

        <a href="#home" className="logo">

          <CarFront size={34} strokeWidth={2.5} />

          <span>

            Smart<span className="logo-highlight">Rent</span>

          </span>

        </a>



        <div className={`nav-links ${mobileMenu ? "show-menu" : ""}`}>
          <a href="#ai-search" onClick={() => setMobileMenu(false)}>
            AI Search
          </a>
        </div>



        <div className="nav-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", flexWrap: "nowrap", minWidth: 0 }}>
          {loggedInUser ? (
            <>
              <span className="login-btn" title={loggedInUser.name} style={{ cursor: "default", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", padding: "0 16px", fontSize: "16px", lineHeight: 1, whiteSpace: "nowrap", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1 }}>
                <UserRound size={19} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{loggedInUser.name}</span>
              </span>
              {loggedInUser?.role !== "admin" && (
                <button
                  type="button"
                  className="login-btn"
                  onClick={fetchNotifications}
                  aria-label="Notifications"
                  title="Notifications"
                  style={{
                    height: 48,
                    width: 48,
                    minWidth: 48,
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={22} />
                  {notifications.filter((item) => !item.isRead).length > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        minWidth: 18,
                        height: 18,
                        padding: "0 4px",
                        borderRadius: 999,
                        background: "#dc2626",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #fff",
                      }}
                    >
                      {notifications.filter((item) => !item.isRead).length}
                    </span>
                  )}
                </button>
              )}
              {loggedInUser?.role !== "admin" && (
                <button type="button" className="login-btn" onClick={() => { setFeedbackStatus({ type: "", text: "" }); setShowFeedback(true); }} style={{ height: "48px", minWidth: "auto", padding: "0 18px", fontSize: "16px", lineHeight: 1, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Feedback
                </button>
              )}
              <button type="button" className="login-btn" onClick={fetchMyBookings} style={{ height: "48px", minWidth: "auto", padding: "0 18px", fontSize: "16px", lineHeight: 1, whiteSpace: "nowrap", flexShrink: 0 }}>
                My Bookings
              </button>
              <button type="button" className="register-btn" onClick={handleLogout} style={{ height: "48px", minWidth: "auto", padding: "0 22px", fontSize: "16px", lineHeight: 1, whiteSpace: "nowrap", flexShrink: 0 }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="login-btn" onClick={() => { setAuthMessage(""); setAuthMode("login"); }}>
                <UserRound size={19} /> Login
              </button>
              <button type="button" className="register-btn" onClick={() => { setAuthMessage(""); setAuthMode("register"); }}>
                Sign Up
              </button>
            </>
          )}
        </div>



        <button

          className="menu-btn"

          onClick={() => setMobileMenu(!mobileMenu)}

        >

          {mobileMenu ? <X size={24} /> : <Menu size={24} />}

        </button>

      </nav>



      {/* HERO SECTION */}

      <section className="hero" id="home">

        <div className="hero-content">

          <span className="hero-tag">

            <ShieldCheck size={16} />

            Your Journey, Our Priority

          </span>



          <h1>

            Find Your Perfect

            <span> Rental Car</span>

          </h1>



          <p>

            Discover and rent your ideal vehicle with SmartRent.

            Simple booking, flexible options, and a smooth journey.

          </p>



          <div className="hero-search">

            <div className="search-field">

              <MapPin size={20} />

              <div>

                <label>Location</label>

                <input

                  type="text"

                  placeholder="Enter your location"

                  value={location}

                  onChange={(e) => setLocation(e.target.value)}

                />

              </div>

            </div>



            <div className="search-field">

              <CalendarDays size={20} />

              <div>

                <label>Pickup Date</label>

                <input

                  type="date"

                  value={pickupDate}

                  onChange={(e) => setPickupDate(e.target.value)}

                />

              </div>

            </div>



            <div className="search-field">

              <CalendarDays size={20} />

              <div>

                <label>Return Date</label>

                <input

                  type="date"

                  value={returnDate}

                  onChange={(e) => setReturnDate(e.target.value)}

                />

              </div>

            </div>



            <button className="search-btn" onClick={handleSearch}>

              <Search size={20} />

              Search

            </button>

          </div>
          {searchMessage && (
            <p role="alert" style={{ marginTop: 10, color: "#b91c1c", fontWeight: 600 }}>
              {searchMessage}
            </p>
          )}

        </div>

      </section>

      {/* DASHBOARD SECTION: visible only to admins */}
      {loggedInUser?.role === "admin" && (
      <section id="dashboard" style={{ padding: "64px 6%", background: "#f8fafc" }}>
        <div className="section-heading">
          <span className="section-tag">OVERVIEW</span>
          <h2>SmartRent Dashboard</h2>
          <p>Live summary of vehicles, rentals, and customers.</p>
        </div>
        {loggedInUser?.role !== "admin" ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>Admin login required to view dashboard charts.</p>
        ) : dashboardLoading ? (
          <p style={{ textAlign: "center" }}>Loading dashboard...</p>
        ) : dashboardError ? (
          <p role="alert" style={{ textAlign: "center", color: "#dc2626" }}>{dashboardError}</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 18, maxWidth: 1200, margin: "28px auto" }}>
              {[
                { label: "Total Vehicles", value: dashboard?.totalVehicles ?? vehicles.length, icon: "🚗" },
                { label: "Available Vehicles", value: dashboard?.availableVehicles ?? vehicles.filter((v) => v.available).length, icon: "🟢" },
                { label: "Rented Vehicles", value: dashboard?.rentedVehicles ?? vehicles.filter((v) => !v.available).length, icon: "🔑" },
                { label: "Total Customers", value: dashboard?.totalCustomers ?? 0, icon: "👥" },
                { label: "Total Bookings", value: dashboard?.totalBookings ?? 0, icon: "📋" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 23 }}>{item.icon}</span>
                  </div>
                  <div style={{ color: "#1d4ed8", fontSize: 32, fontWeight: 800, marginTop: 12 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22, maxWidth: 1200, margin: "28px auto 0" }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
                <h3 style={{ margin: "0 0 22px", color: "#0f172a" }}>Vehicle Availability</h3>
                {[
                  { label: "Available", value: dashboard?.availableVehicles ?? vehicles.filter((v) => v.available).length, color: "#16a34a" },
                  { label: "Rented", value: dashboard?.rentedVehicles ?? vehicles.filter((v) => !v.available).length, color: "#2563eb" },
                ].map((item) => {
                  const total = Number(dashboard?.totalVehicles ?? vehicles.length) || 1;
                  const width = Math.min(100, (Number(item.value || 0) / total) * 100);
                  return <div key={item.label} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#475569", fontSize: 14 }}><span>{item.label}</span><strong>{item.value}</strong></div>
                    <div style={{ height: 12, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${width}%`, height: "100%", background: item.color, borderRadius: 99, transition: "width .3s" }} /></div>
                  </div>;
                })}
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
                <h3 style={{ margin: "0 0 18px", color: "#0f172a" }}>Recent Bookings</h3>
                {Array.isArray(dashboard?.recentBookings) && dashboard.recentBookings.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {dashboard.recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
                        <div><strong style={{ display: "block", color: "#0f172a", fontSize: 14 }}>{booking.vehicle?.name || "Vehicle booking"}</strong><span style={{ color: "#64748b", fontSize: 12 }}>{booking.user?.name || "Customer"}</span></div>
                        <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 13 }}>{booking.status || "Pending"}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: "#64748b", margin: 0 }}>No recent bookings available.</p>}
              </div>
            </div>

            <div style={{ maxWidth: 1200, margin: "28px auto 0", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a" }}>Admin Booking Management</h3>
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>View customer bookings and update their status.</p>
                </div>
                <button type="button" onClick={fetchAdminBookings} disabled={adminBookingsLoading} style={{ border: 0, borderRadius: 8, padding: "10px 16px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: adminBookingsLoading ? "wait" : "pointer" }}>
                  {adminBookingsLoading ? "Refreshing..." : "Refresh Bookings"}
                </button>
              </div>

              {bookingStatusMessage.text && (
                <p role={bookingStatusMessage.type === "error" ? "alert" : "status"} style={{ margin: "0 0 14px", color: bookingStatusMessage.type === "error" ? "#b91c1c" : "#15803d", fontWeight: 600 }}>
                  {bookingStatusMessage.text}
                </p>
              )}
              {adminBookingsLoading ? (
                <p style={{ color: "#64748b" }}>Loading bookings...</p>
              ) : adminBookingsError ? (
                <p role="alert" style={{ color: "#b91c1c" }}>{adminBookingsError}</p>
              ) : adminBookings.length === 0 ? (
                <p style={{ color: "#64748b" }}>No bookings found.</p>
              ) : (
                <div style={{ display: "grid", gap: 12, maxHeight: 620, overflowY: "auto", overflowX: "hidden", paddingRight: 6 }}>
                  {adminBookings.map((booking) => {
                    const closed = ["Cancelled", "Completed"].includes(booking.status);
                    const bookingId = booking._id;
                    return (
                      <div key={bookingId} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1.5fr) minmax(150px, 1fr) minmax(160px, 1fr) minmax(210px, 1.2fr)", gap: 14, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                        <div>
                          <strong style={{ display: "block", color: "#0f172a" }}>{booking.vehicle?.name || "Vehicle"}</strong>
                          <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: 4 }}>{booking.user?.name || "Customer"} {booking.user?.email ? `(${booking.user.email})` : ""}</span>
                          <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: 4 }}>Booking ID: {bookingId}</span>
                        </div>
                        <div style={{ color: "#475569", fontSize: 13 }}>
                          <span style={{ display: "block" }}>Pickup: {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : "—"}</span>
                          <span style={{ display: "block", marginTop: 4 }}>Return: {booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : "—"}</span>
                        </div>
                        <div>
                          <span style={{ display: "block", color: "#64748b", fontSize: 12 }}>Amount</span>
                          <strong style={{ color: "#0f172a" }}>₹{Number(booking.totalAmount || 0).toLocaleString("en-IN")}</strong>
                          <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: 4 }}>Current: {booking.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <select
                            aria-label={`Status for booking ${bookingId}`}
                            value={bookingStatusDrafts[bookingId] ?? booking.status ?? "Pending"}
                            disabled={closed || bookingStatusSavingId === bookingId}
                            onChange={(e) => {
                              setBookingStatusDrafts((current) => ({ ...current, [bookingId]: e.target.value }));
                              setBookingStatusMessage({ type: "", text: "" });
                            }}
                            style={{ flex: "1 1 130px", minWidth: 0, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7, background: closed ? "#f1f5f9" : "#fff", color: "#0f172a" }}
                          >
                            {["Pending", "Confirmed", "Rented", "Returned", "Cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <button type="button" onClick={() => updateBookingStatus(bookingId)} disabled={closed || bookingStatusSavingId === bookingId || (bookingStatusDrafts[bookingId] ?? booking.status) === booking.status} style={{ border: 0, borderRadius: 7, padding: "9px 13px", background: closed || bookingStatusSavingId === bookingId ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: 700, cursor: closed || bookingStatusSavingId === bookingId ? "not-allowed" : "pointer" }}>
                            {bookingStatusSavingId === bookingId ? "Saving..." : "Update"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAdminBooking(bookingId)}
                            disabled={bookingDeletingId === bookingId}
                            aria-label={`Delete booking ${bookingId}`}
                            title="Delete booking"
                            style={{ border: 0, borderRadius: 7, padding: 10, background: bookingDeletingId === bookingId ? "#fecaca" : "#fee2e2", color: "#b91c1c", cursor: bookingDeletingId === bookingId ? "wait" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            {bookingDeletingId === bookingId ? "..." : <Trash2 size={18} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ADMIN-ONLY PRICING HISTORY */}
            <div style={{ maxWidth: 1200, margin: "28px auto 0", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <History size={20} />
                    Pricing History
                  </h3>
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
                    Dynamic pricing changes recorded for admin review.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchPricingHistory}
                  disabled={pricingHistoryLoading}
                  style={{
                    border: 0,
                    borderRadius: 8,
                    padding: "10px 16px",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: pricingHistoryLoading ? "wait" : "pointer",
                  }}
                >
                  {pricingHistoryLoading ? "Refreshing..." : "Refresh History"}
                </button>
              </div>

              {pricingHistoryLoading ? (
                <p style={{ color: "#64748b" }}>Loading pricing history...</p>
              ) : pricingHistory.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>
                  No pricing history recorded yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr>
                        {["Vehicle", "Old Price", "New Price", "Change", "Reason", "Date"].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "12px 10px",
                              borderBottom: "1px solid #e2e8f0",
                              color: "#475569",
                              fontSize: 13,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pricingHistory.map((item) => {
                        const oldPrice = Number(item.oldPrice || 0);
                        const newPrice = Number(item.newPrice || 0);
                        const difference = newPrice - oldPrice;
                        const isIncrease = difference > 0;

                        return (
                          <tr key={item._id}>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9" }}>
                              <strong style={{ color: "#0f172a" }}>
                                {item.vehicle?.name || "Vehicle"}
                              </strong>
                              {item.vehicle?.brand && (
                                <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: 3 }}>
                                  {item.vehicle.brand}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                              ₹{oldPrice.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", fontWeight: 700 }}>
                              ₹{newPrice.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", color: isIncrease ? "#b91c1c" : "#15803d", fontWeight: 700 }}>
                              {difference === 0
                                ? "₹0"
                                : `${isIncrease ? "+" : "-"}₹${Math.abs(difference).toLocaleString("en-IN")}`}
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "5px 9px",
                                borderRadius: 999,
                                background: item.reason === "High Demand" ? "#fee2e2" : item.reason === "Low Demand" ? "#dcfce7" : "#e2e8f0",
                                color: item.reason === "High Demand" ? "#b91c1c" : item.reason === "Low Demand" ? "#166534" : "#475569",
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
                                {item.reason || "Normal Price"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", color: "#64748b", fontSize: 13 }}>
                              {item.changedAt ? new Date(item.changedAt).toLocaleString("en-IN") : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}


      </section>
      )}

      {/* ADMIN-ONLY CUSTOMER FEEDBACK */}
      {loggedInUser?.role === "admin" && (
        <section style={{ padding: "22px 6% 42px", background: "#f8fafc" }}>
          <div
            style={{
              maxWidth: 1050,
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 4px 16px rgba(15,23,42,.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 21,
                  }}
                >
                  <Headphones size={20} />
                  Customer Feedback
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                  Select a customer to open their private chat.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAdminFeedback}
                disabled={adminFeedbackLoading}
                style={{
                  border: 0,
                  borderRadius: 8,
                  padding: "9px 14px",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: adminFeedbackLoading ? "wait" : "pointer",
                }}
              >
                {adminFeedbackLoading ? "Refreshing..." : "Refresh Feedback"}
              </button>
            </div>

            {adminFeedbackError && (
              <p role="alert" style={{ color: "#b91c1c", fontWeight: 600, fontSize: 13 }}>
                {adminFeedbackError}
              </p>
            )}

            {adminFeedbackLoading ? (
              <p style={{ color: "#64748b" }}>Loading customer feedback...</p>
            ) : adminFeedback.length === 0 ? (
              <p style={{ color: "#64748b", margin: 0 }}>
                No customer feedback received yet.
              </p>
            ) : selectedFeedbackId ? (
              (() => {
                const customerGroup = feedbackCustomerGroups.find((group) =>
                  group.items.some((feedback) => feedback._id === selectedFeedbackId)
                );

                if (!customerGroup) {
                  setSelectedFeedbackId(null);
                  return null;
                }

                const chatItems = customerGroup.items;
                const latestFeedback = chatItems[chatItems.length - 1];
                const unreadItems = chatItems.filter((feedback) => !feedback.isRead);

                // Reply to the latest feedback that has not received a reply yet.
                const replyTarget =
                  [...chatItems].reverse().find((feedback) => !feedback.reply) ||
                  latestFeedback;

                return (
                  <div>
                    {/* Chat header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 2px 12px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedFeedbackId(null)}
                          style={{
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            color: "#334155",
                            borderRadius: 8,
                            padding: "7px 10px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ← Back
                        </button>

                        <div>
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>
                            {customerGroup.name}
                          </strong>
                          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                            Private conversation · {chatItems.length} message{chatItems.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>

                      {latestFeedback?.isReplied && (
                        <span
                          style={{
                            padding: "5px 8px",
                            borderRadius: 999,
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          Replied
                        </span>
                      )}
                    </div>

                    {/* One continuous WhatsApp-style chat for this customer */}
                    <div
                      style={{
                        marginTop: 12,
                        background: "#f0f2f5",
                        borderRadius: 12,
                        padding: 12,
                        height: 350,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 9,
                      }}
                    >
                      {chatItems.map((feedback) => (
                        <div key={feedback._id}>
                          <div
                            style={{
                              alignSelf: "flex-start",
                              width: "fit-content",
                              maxWidth: "76%",
                              background: "#fff",
                              borderRadius: "4px 12px 12px 12px",
                              padding: "9px 11px",
                              boxShadow: "0 1px 2px rgba(15,23,42,.08)",
                            }}
                          >
                            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, marginBottom: 3 }}>
                              {customerGroup.name.toUpperCase()}
                            </div>
                            <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {feedback.message}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: 9, textAlign: "right", marginTop: 3 }}>
                              {feedback.createdAt
                                ? new Date(feedback.createdAt).toLocaleString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </div>
                          </div>

                          {feedback.reply && (
                            <div
                              style={{
                                marginTop: 6,
                                marginLeft: "auto",
                                width: "fit-content",
                                maxWidth: "76%",
                                background: "#d9fdd3",
                                borderRadius: "12px 4px 12px 12px",
                                padding: "9px 11px",
                                boxShadow: "0 1px 2px rgba(15,23,42,.08)",
                              }}
                            >
                              <div style={{ color: "#15803d", fontSize: 10, fontWeight: 800, marginBottom: 3 }}>
                                FROM: SMARTRENT
                              </div>
                              <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {feedback.reply}
                              </div>
                              <div style={{ color: "#64748b", fontSize: 9, textAlign: "right", marginTop: 3 }}>
                                {feedback.repliedAt
                                  ? new Date(feedback.repliedAt).toLocaleString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </div>
                            </div>
                          )}

                          {!feedback.isRead && (
                            <button
                              type="button"
                              onClick={() => markFeedbackRead(feedback._id)}
                              disabled={feedbackUpdatingId === feedback._id}
                              style={{
                                marginTop: 5,
                                border: 0,
                                borderRadius: 7,
                                padding: "5px 8px",
                                background: feedbackUpdatingId === feedback._id ? "#94a3b8" : "#2563eb",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: feedbackUpdatingId === feedback._id ? "wait" : "pointer",
                              }}
                            >
                              {feedbackUpdatingId === feedback._id ? "Updating..." : "Mark as Read"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {unreadItems.length > 0 && (
                      <div style={{ marginTop: 7, color: "#64748b", fontSize: 11 }}>
                        {unreadItems.length} unread message{unreadItems.length === 1 ? "" : "s"}
                      </div>
                    )}

                    {/* One reply composer for the continuous customer chat */}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#0f172a", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>
                        Reply as SmartRent
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                        <textarea
                          value={feedbackReplyDrafts[replyTarget._id] || ""}
                          onChange={(e) =>
                            setFeedbackReplyDrafts((current) => ({
                              ...current,
                              [replyTarget._id]: e.target.value,
                            }))
                          }
                          placeholder={`Reply to ${customerGroup.name}...`}
                          maxLength={2000}
                          rows={2}
                          style={{
                            flex: 1,
                            width: "100%",
                            boxSizing: "border-box",
                            resize: "none",
                            minHeight: 58,
                            padding: "9px 10px",
                            border: "1px solid #cbd5e1",
                            borderRadius: 9,
                            outline: "none",
                            fontFamily: "inherit",
                            fontSize: 12,
                            lineHeight: 1.45,
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => sendFeedbackReply(replyTarget._id)}
                          disabled={feedbackReplySavingId === replyTarget._id}
                          style={{
                            border: 0,
                            borderRadius: 9,
                            padding: "10px 13px",
                            background: feedbackReplySavingId === replyTarget._id ? "#94a3b8" : "#2563eb",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: feedbackReplySavingId === replyTarget._id ? "wait" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {feedbackReplySavingId === replyTarget._id ? "Sending..." : "Send"}
                        </button>
                      </div>

                      {feedbackReplyMessages[replyTarget._id]?.text && (
                        <p
                          role={feedbackReplyMessages[replyTarget._id].type === "error" ? "alert" : "status"}
                          style={{
                            margin: "5px 0 0",
                            fontSize: 11,
                            color:
                              feedbackReplyMessages[replyTarget._id].type === "error"
                                ? "#b91c1c"
                                : feedbackReplyMessages[replyTarget._id].type === "success"
                                ? "#15803d"
                                : "#2563eb",
                            fontWeight: 600,
                          }}
                        >
                          {feedbackReplyMessages[replyTarget._id].text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Customer-only list */
              <div
                style={{
                  display: "grid",
                  gap: 7,
                  maxHeight: 420,
                  overflowY: "auto",
                  padding: "2px 4px 2px 0",
                }}
              >
                {feedbackCustomerGroups.map((group) => {
                  const latest = group.items[group.items.length - 1];
                  const hasUnread = group.items.some((item) => !item.isRead);
                  const hasReply = group.items.some((item) => item.isReplied || item.reply);

                  return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setSelectedFeedbackId(latest._id)}
                    style={{
                      width: "100%",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      background: hasUnread ? "#eff6ff" : "#fff",
                      padding: "11px 13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all .15s ease",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: "block",
                          color: "#0f172a",
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {group.name}
                      </strong>

                      <span style={{ display: "block", color: "#94a3b8", fontSize: 11, marginTop: 3 }}>
                        {latest.createdAt
                          ? new Date(latest.createdAt).toLocaleString("en-IN")
                          : "—"} · {group.items.length} message{group.items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {hasUnread && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#2563eb",
                          }}
                        />
                      )}

                      {hasReply && (
                        <span
                          style={{
                            padding: "4px 7px",
                            borderRadius: 999,
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          Replied
                        </span>
                      )}

                      <span style={{ color: "#94a3b8", fontSize: 18 }}>›</span>
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CUSTOMER TOP-RATED VEHICLES */}
      {loggedInUser?.role !== "admin" && (
        <section style={{ padding: "54px 6%", background: "#f8fafc" }}>
          <div className="section-heading">
            <span className="section-tag">CUSTOMER FAVORITES</span>
            <h2>Top-Rated Vehicles</h2>
            <p>Vehicles ranked by customer ratings.</p>
          </div>
          {topRatedLoading ? <p style={{ textAlign: "center" }}>Loading top-rated vehicles...</p> :
            topRatedVehicles.length === 0 ? <p style={{ textAlign: "center", color: "#64748b" }}>No customer ratings yet.</p> : (
              <div className="vehicle-grid">
                {topRatedVehicles.map((vehicle) => (
                  <div className="vehicle-card" key={vehicle._id}>
                    <div className="vehicle-image">
                      <img src={vehicle.image || "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle"} alt={vehicle.name}
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle"; }} />
                    </div>
                    <div className="vehicle-card-content">
                      <div className="vehicle-title"><div><h3>{vehicle.name}</h3><p>{vehicle.brand}</p></div>
                        <div className="vehicle-rating"><Star size={15} fill="currentColor" /><span>{Number(vehicle.rating || 0).toFixed(1)}</span></div>
                      </div>
                      <p style={{ color: "#64748b", fontSize: 13 }}>{Number(vehicle.reviewCount || 0)} customer rating(s)</p>
                      <button type="button" className="details-btn" onClick={() => {
                        const found = vehicles.find((item) => (item._id || item.id) === vehicle._id);
                        setSelectedVehicle(found || { ...vehicle, id: vehicle._id, price: Number(vehicle.pricePerDay || 0), seats: vehicle.seats ?? 5, fuel: vehicle.fuel || "Not specified", transmission: vehicle.transmission || "Not specified", description: vehicle.description || "", available: vehicle.available ?? true });
                      }}>View Details <ArrowRight size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      )}

      {/* AI SEARCH SECTION */}
      <section className="ai-search-section" id="ai-search">

        <div className="section-heading">

          <span className="section-tag">SMART AI</span>

          <h2>Find Vehicles with AI</h2>

          <p>

            Describe the vehicle you need. Our AI search helps

            you find matching vehicles.

          </p>

        </div>



        <div className="ai-search-box">

          <Search size={22} />

          <input

            type="text"

            placeholder="Example: I need a 7 seater family car"

            value={aiQuery}

            onChange={(e) => setAiQuery(e.target.value)}

            onKeyDown={(e) => {

              if (e.key === "Enter") handleAIsearch();

            }}

          />

          <button onClick={handleAIsearch} disabled={aiLoading}>

            {aiLoading ? "Searching..." : "Find Vehicle"}

            {!aiLoading && <ArrowRight size={18} />}

          </button>

        </div>
        {aiError && (
          <p role="alert" className="error-message" style={{ marginTop: "12px" }}>
            {aiError}
          </p>
        )}
        {aiResults !== null && (
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <p role="status" style={{ margin: 0 }}>
              AI found {aiResults.length} matching vehicle{aiResults.length === 1 ? "" : "s"}.
            </p>
            <button type="button" className="clear-filters-btn" onClick={clearAISearch}>
              Clear AI Search
            </button>
          </div>
        )}

      </section>



      {/* VEHICLES SECTION */}

      <section className="vehicles-section" id="vehicles">

        <div className="section-heading">

          <span className="section-tag">OUR FLEET</span>

          <h2>Explore Our Vehicles</h2>

          <p>

            Choose from our collection of vehicles for your

            next journey.

          </p>

        </div>



        {/* SEARCH AND FILTERS */}

        <div className="vehicle-filters">

          <div className="vehicle-search">

            <Search size={20} />

            <input

              type="text"

              placeholder="Search by vehicle name or brand..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

            />

          </div>



          <div className="filter-dropdowns">

            <select

              value={brandFilter}

              onChange={(e) => setBrandFilter(e.target.value)}

            >

              <option value="All">All Brands</option>

              {[...new Set(

                vehicles

                  .map((vehicle) => vehicle.brand)

                  .filter(Boolean)

              )].sort().map((brand) => (

                <option key={brand} value={brand}>

                  {brand}

                </option>

              ))}

            </select>



            <select

              value={fuelFilter}

              onChange={(e) => setFuelFilter(e.target.value)}

            >

              <option value="All">All Fuel Types</option>

              {[...new Set(

                vehicles

                  .map((vehicle) => vehicle.fuel)

                  .filter(Boolean)

              )].sort().map((fuel) => (

                <option key={fuel} value={fuel}>

                  {fuel}

                </option>

              ))}

            </select>



            <select

              value={availabilityFilter}

              onChange={(e) =>

                setAvailabilityFilter(e.target.value)

              }

            >

              <option value="All">All Availability</option>

              <option value="Available">Available</option>

              <option value="Unavailable">Unavailable</option>

            </select>



            <button

              className="clear-filters-btn"

              onClick={() => {

                setSearch("");

                setCategory("All");

                setBrandFilter("All");

                setFuelFilter("All");

                setAvailabilityFilter("All");

              }}

            >

              Clear Filters

            </button>

          </div>

        </div>



        {/* CATEGORY BUTTONS */}

        <div className="category-buttons">

          {[

            "All",

            "Hatchback",

            "Sedan",

            "SUV",

            "MUV",

            "Luxury",

          ].map((item) => (

            <button

              key={item}

              className={

                category === item ? "active-category" : ""

              }

              onClick={() => setCategory(item)}

            >

              {item}

            </button>

          ))}

        </div>



        {/* VEHICLE CARDS */}

        {loading ? (

          <div className="loading-message">

            <p>Loading vehicles...</p>

          </div>

        ) : error ? (

          <div className="error-message">

            <p>{error}</p>

            <button onClick={() => window.location.reload()}>

              Retry

            </button>

          </div>

        ) : filteredVehicles.length === 0 ? (

          <div className="no-vehicles">

            <CarFront size={48} />

            <h3>No vehicles found</h3>

            <p>Try changing your search or filters.</p>

          </div>

        ) : (

          <div className="vehicle-grid">

            {filteredVehicles.map((vehicle) => (

              <div className="vehicle-card" key={vehicle.id}>

                <div className="vehicle-image">

                  <img

                    src={vehicle.image}

                    alt={vehicle.name}

                    onError={(e) => {

                      e.currentTarget.src =

                        "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle";

                    }}

                  />



                  <span

                    className={`availability-badge ${

                      vehicle.available

                        ? "available"

                        : "unavailable"

                    }`}

                  >

                    {vehicle.available

                      ? "Available"

                      : "Unavailable"}

                  </span>

                </div>



                <div className="vehicle-card-content">

                  <div className="vehicle-title">

                    <div>

                      <h3>{vehicle.name}</h3>

                      <p>{vehicle.brand}</p>

                    </div>



                    <div className="vehicle-rating">

                      <Star size={15} fill="currentColor" />

                      <span>{Number(vehicle.rating || 0).toFixed(1)}</span>

                    </div>

                  </div>



                  <div className="vehicle-specs">

                    <span>

                      <Users size={16} />

                      {vehicle.seats} Seats

                    </span>

                    <span>

                      <Fuel size={16} />

                      {vehicle.fuel}

                    </span>

                    <span>

                      <Settings size={16} />

                      {vehicle.transmission}

                    </span>

                  </div>



                  <div className="vehicle-card-footer">

                    <div className="vehicle-price">

                      <strong>

                        ₹{vehicle.price.toLocaleString("en-IN")}

                      </strong>

                      <span>/ day</span>

                    </div>



                    <button

                      className="details-btn"

                      onClick={() => setSelectedVehicle(vehicle)}

                    >

                      View Details

                      <ArrowRight size={16} />

                    </button>

                  </div>

                  {loggedInUser?.role === "admin" && (
                    <div
                      className="admin-rate-editor"
                      style={{
                        marginTop: 14,
                        padding: 12,
                        border: "1px solid #bfdbfe",
                        borderRadius: 10,
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <label htmlFor={`rate-${vehicle._id || vehicle.id}`} style={{ color: "#1e40af", fontSize: 13, fontWeight: 700 }}>
                        Update Rate (₹/day)
                      </label>
                      <input
                        id={`rate-${vehicle._id || vehicle.id}`}
                        type="number"
                        min="1"
                        step="1"
                        aria-label={`Daily rate for ${vehicle.name}`}
                        value={rateDrafts[vehicle._id || vehicle.id] ?? String(vehicle.pricePerDay ?? vehicle.price ?? 0)}
                        onChange={(e) => {
                          const id = vehicle._id || vehicle.id;
                          setRateDrafts((current) => ({ ...current, [id]: e.target.value }));
                          setRateMessages((current) => ({ ...current, [id]: null }));
                        }}
                        style={{ width: 130, minWidth: 0, padding: "8px 10px", border: "1px solid #bfdbfe", borderRadius: 6, background: "#fff", color: "#0f172a" }}
                      />
                      <button
                        type="button"
                        onClick={() => updateVehicleRate(vehicle._id || vehicle.id, rateDrafts[vehicle._id || vehicle.id] ?? String(vehicle.pricePerDay ?? vehicle.price ?? 0))}
                        disabled={rateSavingId === (vehicle._id || vehicle.id)}
                        style={{ border: 0, borderRadius: 6, padding: "8px 14px", background: rateSavingId === (vehicle._id || vehicle.id) ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: 700, cursor: rateSavingId === (vehicle._id || vehicle.id) ? "wait" : "pointer" }}
                      >
                        {rateSavingId === (vehicle._id || vehicle.id) ? "Saving..." : "Save"}
                      </button>
                      {rateMessages[vehicle._id || vehicle.id] && (
                        <span role="status" style={{ width: "100%", color: rateMessages[vehicle._id || vehicle.id].type === "success" ? "#15803d" : "#b91c1c", fontSize: 13 }}>
                          {rateMessages[vehicle._id || vehicle.id].text}
                        </span>
                      )}
                    </div>
                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

            {/* VEHICLE DETAILS MODAL */}

      {selectedVehicle && (

        <div

          className="modal-overlay"

          onClick={() => setSelectedVehicle(null)}

        >

          <div

            className="modal-content"

            onClick={(e) => e.stopPropagation()}

          >

            <button

              className="modal-close"

              onClick={() => setSelectedVehicle(null)}

            >

              <X size={24} />

            </button>



            <img

              src={selectedVehicle.image}

              alt={selectedVehicle.name}

              className="modal-image"

              onError={(e) => {

                e.currentTarget.src =

                  "https://placehold.co/800x500/e2e8f0/334155?text=Vehicle";

              }}

            />



            <div className="modal-details">

              <h2>{selectedVehicle.name}</h2>

              <p>{selectedVehicle.brand}</p>



              <div className="vehicle-specs">

                <span>

                  <Users size={16} />

                  {selectedVehicle.seats} Seats

                </span>

                <span>

                  <Fuel size={16} />

                  {selectedVehicle.fuel}

                </span>

                <span>

                  <Settings size={16} />

                  {selectedVehicle.transmission}

                </span>

              </div>



              <p>{selectedVehicle.description}</p>



              <div className="modal-price">

                <strong>

                  ₹

                  {selectedVehicle.price.toLocaleString("en-IN")}

                </strong>

                <span> / day</span>

              </div>



              <button

                className="book-btn"

                disabled={!selectedVehicle.available}

                onClick={() => handleBooking(selectedVehicle)}

              >

                {selectedVehicle.available

                  ? "Book Now"

                  : "Currently Unavailable"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* BOOKING MODAL */}

      {bookingVehicle && (

        <div

          className="modal-overlay"

          onClick={() => setBookingVehicle(null)}

        >

          <div

            className="modal-content booking-modal"

            onClick={(e) => e.stopPropagation()}

          >

            <button

              className="modal-close"

              onClick={() => setBookingVehicle(null)}

            >

              <X size={24} />

            </button>



            <h2>Book Your Vehicle</h2>

            <p>{bookingVehicle.name}</p>



            <form onSubmit={submitBooking}>

              <label>Pickup Location</label>

              <input

                type="text"

                value={location}

                onChange={(e) => setLocation(e.target.value)}

                placeholder="Enter pickup location"

                required

              />



              <label>Pickup Date</label>

              <input

                type="date"

                value={pickupDate}

                onChange={(e) => setPickupDate(e.target.value)}

                required

              />



              <label>Return Date</label>

              <input

                type="date"

                value={returnDate}

                onChange={(e) => setReturnDate(e.target.value)}

                required

              />



              {bookingError && (
                <p role="alert" style={{ color: "#dc2626", margin: "8px 0" }}>
                  {bookingError}
                </p>
              )}

              <button type="submit" className="book-btn" disabled={bookingLoading}>
                {bookingLoading ? "Creating Booking..." : "Confirm Booking"}
              </button>

            </form>

          </div>

        </div>

      )}

      {/* BOOKING SUCCESS MODAL */}
      {bookingSuccess && (
        <div className="modal-overlay" onClick={() => setBookingSuccess(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(92vw, 500px)", padding: "32px", position: "relative" }}>
            <button type="button" className="modal-close" aria-label="Close booking confirmation" onClick={() => setBookingSuccess(null)}><X size={24} /></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, color: "#16a34a" }}>✓</div>
              <h2 style={{ margin: "8px 0" }}>Thank You!</h2>
              <p>Your booking has been created successfully.</p>
            </div>
            <div style={{ background: "#f8fafc", color: "#1e293b", borderRadius: 12, padding: 18, margin: "20px 0", lineHeight: 1.9 }}>
              <strong>Booking Details</strong><br />
              Vehicle: {bookingSuccess.vehicleName || bookingSuccess.vehicle?.name || "Vehicle"}<br />
              Pickup: {bookingSuccess.pickupDate ? new Date(bookingSuccess.pickupDate).toLocaleDateString("en-IN") : "-"}<br />
              Return: {bookingSuccess.returnDate ? new Date(bookingSuccess.returnDate).toLocaleDateString("en-IN") : "-"}<br />
              Location: {bookingSuccess.location || "-"}<br />
              Total Amount: ₹{Number(bookingSuccess.totalAmount || 0).toLocaleString("en-IN")}<br />
              Status: {bookingSuccess.status || "Pending"}
            </div>
            <button type="button" className="book-btn" onClick={() => { setBookingSuccess(null); fetchMyBookings(); }}>View My Bookings</button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(94vw, 600px)",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 28,
              position: "relative",
            }}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close notifications"
              onClick={() => setShowNotifications(false)}
            >
              <X size={24} />
            </button>
            <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={24} /> Notifications
            </h2>
            {notificationsLoading ? (
              <p>Loading notifications...</p>
            ) : notificationsError ? (
              <p role="alert" style={{ color: "#dc2626" }}>{notificationsError}</p>
            ) : notifications.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 16,
                    margin: "12px 0",
                    background: notification.isRead ? "#fff" : "#eff6ff",
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <strong>{notification.title}</strong>
                    {!notification.isRead && (
                      <span style={{ color: "#2563eb", fontSize: 12, fontWeight: 700 }}>NEW</span>
                    )}
                  </div>
                  {notification.type === "Customer Feedback Reply" ? (
                    <div
                      style={{
                        margin: "10px 0",
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          color: "#1d4ed8",
                          fontSize: 13,
                          fontWeight: 800,
                          marginBottom: 6,
                        }}
                      >
                        FROM: SMARTRENT
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", color: "#334155" }}>
                        {String(notification.message || "").replace(/^From:\s*SmartRent\s*\n*/i, "")}
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>
                      {notification.message}
                    </p>
                  )}
                  <small style={{ color: "#64748b" }}>
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString("en-IN")
                      : ""}
                  </small>
                  {!notification.isRead && (
                    <div>
                      <button
                        type="button"
                        onClick={() => markNotificationRead(notification._id)}
                        disabled={notificationUpdatingId === notification._id}
                        style={{
                          display: "block",
                          marginTop: 10,
                          border: 0,
                          borderRadius: 7,
                          padding: "8px 12px",
                          background: "#2563eb",
                          color: "#fff",
                          cursor: notificationUpdatingId === notification._id ? "wait" : "pointer",
                        }}
                      >
                        {notificationUpdatingId === notification._id ? "Updating..." : "Mark as read"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MY BOOKINGS MODAL */}
      {showMyBookings && (
        <div className="modal-overlay" onClick={() => setShowMyBookings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(94vw, 700px)", maxHeight: "85vh", overflowY: "auto", padding: 28, position: "relative" }}>
            <button type="button" className="modal-close" aria-label="Close my bookings" onClick={() => setShowMyBookings(false)}><X size={24} /></button>
            <h2>My Bookings</h2>
            {bookingsLoading ? <p>Loading your bookings...</p> : bookingsError ? <p role="alert" style={{ color: "#dc2626" }}>{bookingsError}</p> : myBookings.length === 0 ? <p>You have no bookings yet.</p> : myBookings.map((booking) => (
              <div key={booking._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, margin: "14px 0", lineHeight: 1.8 }}>
                <strong>{booking.vehicle?.name || "Vehicle"}</strong>{booking.vehicle?.brand ? ` — ${booking.vehicle.brand}` : ""}<br />
                Pickup: {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString("en-IN") : "-"}<br />
                Return: {booking.returnDate ? new Date(booking.returnDate).toLocaleDateString("en-IN") : "-"}<br />
                Location: {booking.location || "-"}<br />
                Total: ₹{Number(booking.totalAmount || 0).toLocaleString("en-IN")}<br />
                Status: <strong>{booking.status || "Pending"}</strong>
                {booking.status === "Returned" && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      borderRadius: 8,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong style={{ color: "#c2410c" }}>Late Return Details</strong>
                    <br />
                    Actual Return Date: {booking.actualReturnDate
                      ? new Date(booking.actualReturnDate).toLocaleDateString("en-IN")
                      : "Not recorded"}
                    <br />
                    Late Days: {Number(booking.lateDays || 0)}
                    <br />
                    Fine Amount: <strong style={{ color: "#dc2626" }}>
                      ₹{Number(booking.fineAmount || 0).toLocaleString("en-IN")}
                    </strong>
                    {booking.fineReason && (
                      <>
                        <br />
                        {booking.fineReason}
                      </>
                    )}
                  </div>
                )}
                {["Returned", "Completed"].includes(booking.status) && booking.vehicle?._id && loggedInUser?.role !== "admin" && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                    {booking.hasRated || ratingMessages[booking._id]?.type === "success" ? (
                      <p role="status" style={{ color: "#15803d", margin: 0, fontWeight: 700 }}>You have already rated this rental.</p>
                    ) : (
                      <>
                        <label htmlFor={`customer-rating-${booking._id}`} style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Rate this vehicle</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <div role="radiogroup" aria-label="Choose vehicle rating" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((value) => {
                              const selectedRating = Number(customerRatings[booking._id] || 0);
                              return (
                                <button key={value} type="button" role="radio" aria-checked={selectedRating === value}
                                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                                  onClick={() => setCustomerRatings((current) => ({ ...current, [booking._id]: value }))}
                                  disabled={ratingSavingId === booking._id}
                                  style={{ border: 0, background: "transparent", padding: 2, cursor: "pointer", lineHeight: 1 }}
                                  title={`${value} star${value === 1 ? "" : "s"}`}>
                                  <Star size={30} fill={value <= selectedRating ? "#facc15" : "none"}
                                    color={value <= selectedRating ? "#eab308" : "#94a3b8"} strokeWidth={2.2} />
                                </button>
                              );
                            })}
                          </div>
                          <span style={{ fontWeight: 700, color: "#334155", minWidth: 54 }}>
                            {customerRatings[booking._id] ? `${customerRatings[booking._id]}/5` : "Select stars"}
                          </span>
                          <button type="button" onClick={() => submitVehicleRating(booking._id, booking.vehicle._id, customerRatings[booking._id])}
                            disabled={ratingSavingId === booking._id || !customerRatings[booking._id]}
                            style={{ border: 0, borderRadius: 7, padding: "9px 14px", background: ratingSavingId === booking._id || !customerRatings[booking._id] ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: 700, cursor: ratingSavingId === booking._id || !customerRatings[booking._id] ? "not-allowed" : "pointer" }}>
                            {ratingSavingId === booking._id ? "Saving..." : "Submit Rating"}
                          </button>
                        </div>
                        {ratingMessages[booking._id] && <p role={ratingMessages[booking._id].type === "error" ? "alert" : "status"} style={{ color: ratingMessages[booking._id].type === "error" ? "#b91c1c" : "#15803d", margin: "8px 0 0", fontWeight: 600 }}>{ratingMessages[booking._id].text}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOMER FEEDBACK MODAL */}
      {showFeedback && loggedInUser?.role !== "admin" && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(92vw, 560px)", padding: "30px", position: "relative" }}>
            <button type="button" className="modal-close" aria-label="Close feedback form" onClick={() => setShowFeedback(false)}>
              <X size={24} />
            </button>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2563eb", fontWeight: 800 }}>
                <Headphones size={22} /> SmartRent Support
              </div>
              <h2 style={{ margin: "12px 0 6px", color: "#0f172a" }}>Customer Feedback</h2>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>Share your experience, suggestions, or any issue with the SmartRent service.</p>
            </div>

            <form onSubmit={submitFeedback} style={{ display: "grid", gap: 12 }}>
              <label htmlFor="customer-feedback-message" style={{ fontWeight: 700, color: "#334155" }}>Your feedback</label>
              <textarea
                id="customer-feedback-message"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Type your feedback here..."
                maxLength={2000}
                rows={7}
                required
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 150, padding: 13, border: "1px solid #cbd5e1", borderRadius: 10, outline: "none", fontFamily: "inherit", fontSize: 14, lineHeight: 1.6 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#94a3b8", fontSize: 12 }}>
                <span>Your name and email are sent with the feedback.</span>
                <span>{feedbackMessage.length}/2000</span>
              </div>

              {feedbackStatus.text && (
                <p role={feedbackStatus.type === "error" ? "alert" : "status"} style={{ margin: 0, color: feedbackStatus.type === "error" ? "#b91c1c" : feedbackStatus.type === "success" ? "#15803d" : "#2563eb", fontWeight: 600 }}>
                  {feedbackStatus.text}
                </p>
              )}

              <button type="submit" disabled={feedbackSending} style={{ border: 0, borderRadius: 9, padding: "12px 18px", background: feedbackSending ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: 800, cursor: feedbackSending ? "wait" : "pointer" }}>
                {feedbackSending ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN / REGISTRATION MODAL */}
      {authMode && (
        <div className="modal-overlay" onClick={() => setAuthMode("")}>
          <div
            className="modal-content auth-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(92vw, 440px)", padding: "32px", position: "relative" }}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close authentication form"
              onClick={() => setAuthMode("")}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "22px", fontWeight: 800 }}>
                <CarFront size={28} /> Smart<span style={{ color: "#2563eb" }}>Rent</span>
              </div>
              <h2 style={{ margin: "16px 0 6px" }}>
                {authMode === "register" ? "Create your account" : "Welcome back"}
              </h2>
              <p style={{ margin: 0, opacity: 0.75 }}>
                {authMode === "register" ? "Register to start renting vehicles" : "Login to continue to SmartRent"}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: "grid", gap: "12px" }}>
              {authMode === "register" && (
                <>
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Enter your name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </>
              )}

              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="Enter your email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                autoComplete="email"
              />

              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder={authMode === "register" ? "At least 8 characters" : "Enter your password"}
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                minLength={authMode === "register" ? 8 : undefined}
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
              />

              {authMessage && (
                <p role="alert" style={{ margin: 0, color: authMessage.toLowerCase().includes("successful") ? "#15803d" : "#dc2626" }}>
                  {authMessage}
                </p>
              )}

              <button type="submit" className="book-btn" disabled={authLoading} style={{ marginTop: "8px" }}>
                {authLoading ? "Please wait..." : authMode === "register" ? "Create Account" : "Login"}
              </button>
            </form>

            <p style={{ textAlign: "center", margin: "18px 0 0" }}>
              {authMode === "register" ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMessage("");
                  setAuthMode(authMode === "register" ? "login" : "register");
                }}
                style={{ border: 0, background: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
              >
                {authMode === "register" ? "Login" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



export default App;