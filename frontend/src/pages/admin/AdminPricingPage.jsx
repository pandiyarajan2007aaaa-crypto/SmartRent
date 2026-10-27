import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function AdminPricingPage() {
  const toast = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getPricingHistory();
      if (res.success && Array.isArray(res.history)) {
        setHistory(res.history);
      }
    } catch (err) {
      toast.error("Failed to load pricing audit log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Tariff Audit Trail
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Dynamic & Admin Pricing History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete historical log of algorithm-driven surge/discount pricing and manual administrator rate updates.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-3">Previous Tariff</th>
                <th className="py-3 px-3">New Tariff</th>
                <th className="py-3 px-3">Adjustment</th>
                <th className="py-3 px-3">Trigger Reason</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <span>Loading pricing history...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No pricing modifications recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const diff = Number(item.newPrice) - Number(item.oldPrice);
                  const isIncrease = diff > 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {item.vehicle?.name || "Vehicle"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.vehicle?.brand || "Brand"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-600 line-through">
                        ₹{Number(item.oldPrice || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-900">
                        ₹{Number(item.newPrice || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                            isIncrease
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isIncrease ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isIncrease ? `+₹${diff}` : `-₹${Math.abs(diff)}`}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {new Date(item.changedAt || item.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
