import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import {
  X,
  Sparkles,
  Search,
  Loader2,
  Users,
  Fuel,
  Settings,
  Star,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function AISearchModal({ isOpen, onClose, onSelectVehicle }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setError("Please describe what kind of vehicle you need.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await api.aiSearch(prompt.trim());
      if (data && data.success) {
        setResults({
          aiGenerated: data.aiGenerated,
          isFallback: data.isFallback,
          statusMessage: data.statusMessage,
          requirements: data.requirements,
          vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        });
      } else {
        setError(data?.message || "AI search could not find a match.");
      }
    } catch (err) {
      setError(
        err.message || "AI Search service is temporarily unavailable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "7 seater diesel car for family road trip under ₹3500/day",
    "Automatic petrol sedan for business travel in city",
    "Economical hatchback with good mileage under ₹2000",
    "Spacious electric SUV for comfortable highway drive",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">AI Vehicle Finder</h3>
              <p className="text-xs text-slate-300">
                Describe your journey in natural language and let AI match the ideal fleet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="p-5 border-b border-slate-100 bg-slate-50/60 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Need a 7 seater SUV for a hill station trip with family, budget under ₹3000..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none shadow-sm"
            />
          </div>

          {/* Quick prompt chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Try:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-800 font-semibold hover:bg-rose-100 flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Extracts seats, fuel, category, budget & transmission
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Fleet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Search with AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs font-medium">Extracting criteria & querying live database...</span>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Extracted Requirements Chips & Model Status Badge */}
              <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Extracted Criteria:
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      results.aiGenerated
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    {results.aiGenerated ? "✓ Groq AI Powered" : "⚡ Smart Search"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {results.requirements?.type && results.requirements.type !== "Any Category" && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Type: {results.requirements.type}
                    </span>
                  )}
                  {results.requirements?.brand && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Brand: {results.requirements.brand}
                    </span>
                  )}
                  {results.requirements?.seats && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Seats: {results.requirements.seats}+
                    </span>
                  )}
                  {results.requirements?.maxBudget && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Budget: ≤ ₹{Number(results.requirements.maxBudget).toLocaleString("en-IN")}
                    </span>
                  )}
                  {results.requirements?.fuel && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Fuel: {results.requirements.fuel}
                    </span>
                  )}
                  {results.requirements?.transmission && (
                    <span className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-900 font-semibold">
                      Gearbox: {results.requirements.transmission}
                    </span>
                  )}
                </div>
              </div>

              {/* Matched list header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Matching Vehicles ({results.vehicles.length})
                </span>
                {results.vehicles.length > 0 && (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Available for immediate booking
                  </span>
                )}
              </div>

              {results.vehicles.length === 0 ? (
                <div className="space-y-4">
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-700">
                      No exact matches found for all specified criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try relaxing your budget limit or specifying a different seat count.
                    </p>
                  </div>

                  {results.suggestions && results.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700">
                        Recommended Closest Alternatives:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {results.suggestions.map((v) => (
                          <div
                            key={v._id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <img
                                src={
                                  v.image ||
                                  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
                                }
                                alt={v.name}
                                className="w-full h-24 object-cover rounded-lg mb-2"
                              />
                              <h4 className="text-xs font-bold text-slate-900">
                                {v.brand} {v.name}
                              </h4>
                              <p className="text-[10px] text-slate-500">
                                {v.type} • {v.seats} Seats • ₹{Number(v.pricePerDay).toLocaleString("en-IN")}/day
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(`/vehicles/${v._id}`);
                              }}
                              className="mt-2 w-full py-1 text-center bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold rounded-lg"
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.vehicles.map((v) => (
                    <div
                      key={v._id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 transition-all bg-white hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <img
                          src={
                            v.image ||
                            "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
                          }
                          alt={v.name}
                          className="w-full h-28 object-cover rounded-lg border border-slate-100"
                        />
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {v.brand} {v.name}
                            </h4>
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {v.rating || 4.5}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3" />
                              {v.seats} Seats
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Fuel className="w-3 h-3" />
                              {v.fuel}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Settings className="w-3 h-3" />
                              {v.transmission}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            ₹{Number(v.pricePerDay || v.price || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400"> / day</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onSelectVehicle) {
                              onSelectVehicle(v);
                            } else {
                              navigate(`/vehicles/${v._id}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
