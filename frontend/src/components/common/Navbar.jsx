import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  Car,
  Bell,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Menu,
  X,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function Navbar({ onOpenNotifications, onOpenFeedback }) {
  const { user, isAdmin, logout, openLogin, openRegister } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications count if user is logged in
  const currentUserId = user?._id || user?.id || "";

  useEffect(() => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }
    let isSubscribed = true;
    const fetchUnread = async () => {
      try {
        const data = await api.getNotifications(currentUserId);
        if (isSubscribed && data.success && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch {
        // Silently catch background poll failures
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [currentUserId]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Smart<span className="text-teal-600">Rent</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                Fleet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Vehicle Rental System
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/"
                ? "text-teal-600 bg-teal-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Home
          </Link>
          <Link
            to="/vehicles"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/vehicles"
                ? "text-teal-600 bg-teal-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Fleet & Search
          </Link>
          <a
            href="/#how-it-works"
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            How It Works
          </a>
          <button
            onClick={onOpenFeedback}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Support</span>
          </button>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications Button */}
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* My Bookings */}
              <Link
                to="/my-bookings"
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  location.pathname === "/my-bookings"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <span>My Bookings</span>
              </Link>

              {/* Admin Portal Button */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-teal-400 hover:bg-slate-800 shadow-sm transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-400" />
                  <span>Admin Console</span>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.name ? user.name[0] : "U"}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin/analytics"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>Business Analytics</span>
                      </Link>
                    )}
                    <Link
                      to="/my-bookings"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                      <span>Booking History</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openLogin}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={openRegister}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-teal-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 rounded-xl hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <Link
            to="/"
            className="block px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/vehicles"
            className="block px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            Fleet & Search
          </Link>
          <a
            href="/#how-it-works"
            className="block px-3 py-2 text-base font-semibold text-slate-800 rounded-lg hover:bg-slate-50"
          >
            How It Works
          </a>

          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to="/my-bookings"
                className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-teal-700 bg-teal-50/60 rounded-xl"
              >
                <CalendarDays className="w-5 h-5 text-teal-600" />
                <span>My Bookings</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-900 bg-slate-100 rounded-xl"
                >
                  <LayoutDashboard className="w-5 h-5 text-teal-600" />
                  <span>Admin Console</span>
                </Link>
              )}
              <button
                type="button"
                onClick={onOpenFeedback}
                className="w-full flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <span>Submit Feedback</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-base font-semibold text-rose-600 rounded-xl hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out ({user.name})</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLogin();
                }}
                className="w-full py-2.5 font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openRegister();
                }}
                className="w-full py-2.5 font-semibold text-white bg-teal-600 rounded-xl shadow"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
