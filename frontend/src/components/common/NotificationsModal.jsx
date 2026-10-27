import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Loader2,
  RotateCcw,
  LogIn,
} from "lucide-react";

export default function NotificationsModal({ isOpen, onClose }) {
  const { user, openLogin } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readingId, setReadingId] = useState("");
  const [error, setError] = useState("");

  const userId = user?._id || user?.id || "";

  const fetchNotifications = useCallback(
    async (signal) => {
      if (!userId) return;
      setLoading(true);
      setError("");

      try {
        const data = await api.getNotifications(userId, { signal });
        if (data && data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setError(data?.message || "Failed to load notifications.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Failed to load notifications. Please check your network."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!userId) {
      setNotifications([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    fetchNotifications(controller.signal);

    return () => {
      controller.abort();
    };
  }, [isOpen, userId, fetchNotifications]);

  if (!isOpen) return null;

  const handleMarkRead = async (id) => {
    setReadingId(id);
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (err) {
      toast.error(err.message || "Unable to update notification.");
    } finally {
      setReadingId("");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "Booking Confirmation":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "Return Confirmation":
        return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
      case "Late Fee Alert":
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case "Customer Feedback Reply":
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">
                Updates regarding your bookings, returns, and support replies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {!userId ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Authentication Required
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Please log in to your SmartRent account to view your notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openLogin();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In Now</span>
              </button>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs font-medium">Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col items-center text-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchNotifications()}
                className="mt-1 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-rose-900 font-semibold hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No notifications yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                You will receive alerts here when booking updates occur.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  item.isRead
                    ? "bg-white border-slate-100 text-slate-700"
                    : "bg-teal-50/50 border-teal-200/80 text-slate-900 shadow-sm"
                }`}
              >
                <div className="shrink-0 mt-0.5">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {item.message}
                  </p>
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkRead(item._id)}
                      disabled={readingId === item._id}
                      className="mt-2 text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                    >
                      {readingId === item._id ? "Marking..." : "Mark as read"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
