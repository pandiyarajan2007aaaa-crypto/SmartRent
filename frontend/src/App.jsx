import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";

// Customer Components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AuthModal from "./components/common/AuthModal";
import NotificationsModal from "./components/common/NotificationsModal";
import FeedbackModal from "./components/common/FeedbackModal";

// Customer Pages
import HomePage from "./pages/HomePage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleDetailsPage from "./pages/VehicleDetailsPage";
import MyBookingsPage from "./pages/MyBookingsPage";

// Admin Components & Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminVehiclesPage from "./pages/admin/AdminVehiclesPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminFeedbackPage from "./pages/admin/AdminFeedbackPage";
import AdminPricingPage from "./pages/admin/AdminPricingPage";

function CustomerLayout({ onOpenNotifications, onOpenFeedback, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onOpenNotifications={onOpenNotifications} onOpenFeedback={onOpenFeedback} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function AppContent() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <Routes>
        {/* Customer Routes with Navbar & Footer */}
        <Route
          path="/"
          element={
            <CustomerLayout
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenFeedback={() => setFeedbackOpen(true)}
            >
              <HomePage />
            </CustomerLayout>
          }
        />
        <Route
          path="/vehicles"
          element={
            <CustomerLayout
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenFeedback={() => setFeedbackOpen(true)}
            >
              <VehiclesPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <CustomerLayout
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenFeedback={() => setFeedbackOpen(true)}
            >
              <VehicleDetailsPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <CustomerLayout
              onOpenNotifications={() => setNotificationsOpen(true)}
              onOpenFeedback={() => setFeedbackOpen(true)}
            >
              <MyBookingsPage />
            </CustomerLayout>
          }
        />

        {/* Admin Shell Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="vehicles" element={<AdminVehiclesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="pricing-history" element={<AdminPricingPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      <AuthModal />
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
