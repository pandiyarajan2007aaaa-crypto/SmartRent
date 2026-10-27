import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  MessageSquare,
  Reply,
  Clock,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AdminFeedbackPage() {
  const toast = useToast();

  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState("");

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminFeedback();
      if (res.success && Array.isArray(res.feedback)) {
        setFeedbackList(res.feedback);
      }
    } catch (err) {
      toast.error("Failed to load feedback inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSendReply = async (feedbackId) => {
    const replyText = (replyDrafts[feedbackId] || "").trim();
    if (!replyText) {
      toast.warning("Please type a response before submitting.");
      return;
    }

    setReplyingId(feedbackId);
    try {
      const res = await api.replyFeedback(feedbackId, replyText);
      if (res.success && res.feedback) {
        toast.success("Reply delivered to customer in-app notifications.");
        setFeedbackList((prev) =>
          prev.map((item) => (item._id === feedbackId ? res.feedback : item))
        );
        setReplyDrafts((prev) => ({ ...prev, [feedbackId]: "" }));
      } else {
        toast.error(res.message || "Failed to deliver reply.");
      }
    } catch (err) {
      toast.error(err.message || "Unable to send reply.");
    } finally {
      setReplyingId("");
    }
  };

  const handleMarkRead = async (feedbackId) => {
    try {
      const res = await api.markFeedbackRead(feedbackId);
      if (res.success) {
        setFeedbackList((prev) =>
          prev.map((item) => (item._id === feedbackId ? { ...item, isRead: true } : item))
        );
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Customer Support Center
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Support Inquiries & Customer Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review customer suggestions, inquiries, and send direct responses to customer in-app notification centers.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFeedback}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh Messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Loading customer inquiries...</span>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No support tickets found</h3>
            <p className="text-xs text-slate-400">All customer inquiries have been addressed.</p>
          </div>
        ) : (
          feedbackList.map((item) => (
            <div
              key={item._id}
              className={`p-6 rounded-3xl border transition-all space-y-4 ${
                !item.isRead
                  ? "bg-teal-50/40 border-teal-200/80 shadow-sm"
                  : "bg-white border-slate-200/90 shadow-sm"
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-300 font-bold text-xs flex items-center justify-center uppercase">
                    {item.name ? item.name[0] : "C"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      {!item.isRead && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{item.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-900 mb-1">Customer Message:</p>
                <p className="whitespace-pre-line">{item.message}</p>
              </div>

              {/* Existing Reply if already sent */}
              {item.isReplied && item.reply && (
                <div className="text-xs text-teal-900 leading-relaxed bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-teal-800 flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-teal-600" />
                      SmartRent Support Reply:
                    </span>
                    <span className="text-[10px] text-teal-600">
                      {item.repliedAt ? new Date(item.repliedAt).toLocaleDateString("en-IN") : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">{item.reply}</p>
                </div>
              )}

              {/* Reply Input Box */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Type official response from SmartRent Support..."
                  value={replyDrafts[item._id] || ""}
                  onChange={(e) =>
                    setReplyDrafts({ ...replyDrafts, [item._id]: e.target.value })
                  }
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
                <button
                  type="button"
                  disabled={replyingId === item._id || !replyDrafts[item._id]}
                  onClick={() => handleSendReply(item._id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {replyingId === item._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
