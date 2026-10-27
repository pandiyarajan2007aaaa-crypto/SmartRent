import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export default function AdminVehiclesPage() {
  const toast = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Add / Edit Modal States
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    type: "SUV",
    pricePerDay: "",
    image: "",
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    mileage: "",
    engineCapacity: "",
    luggageCapacity: "",
    modelYear: "",
    description: "",
    available: true,
  });

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState("");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.getVehicles({
        includeArchived: "true",
      });
      if (res.success && Array.isArray(res.vehicles)) {
        setVehicles(res.vehicles);
      }
    } catch (err) {
      toast.error("Failed to load vehicle list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filtered List
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        search.trim() === "" ||
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.brand?.toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType === "All" || v.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [vehicles, search, filterType]);

  const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, currentPage]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: "",
      brand: "",
      type: "SUV",
      pricePerDay: "",
      image: "",
      seats: 5,
      fuel: "Petrol",
      transmission: "Manual",
      mileage: "",
      engineCapacity: "",
      luggageCapacity: "",
      modelYear: new Date().getFullYear(),
      description: "",
      available: true,
    });
    setModalError("");
    setModalMode("add");
  };

  // Open Edit Modal
  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name || "",
      brand: v.brand || "",
      type: v.type || "SUV",
      pricePerDay: v.pricePerDay || "",
      image: v.image || "",
      seats: v.seats || 5,
      fuel: v.fuel || "Petrol",
      transmission: v.transmission || "Manual",
      mileage: v.mileage || "",
      engineCapacity: v.engineCapacity || "",
      luggageCapacity: v.luggageCapacity || "",
      modelYear: v.modelYear || "",
      description: v.description || "",
      available: Boolean(v.available),
    });
    setModalError("");
    setModalMode("edit");
  };

  // Handle Save
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.brand.trim() || !formData.pricePerDay) {
      setModalError("Vehicle Name, Brand, and Daily Rental Price are required.");
      return;
    }

    if (Number(formData.pricePerDay) <= 0) {
      setModalError("Price per day must be a positive number.");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (modalMode === "add") {
        const res = await api.createVehicle(formData);
        if (res.success && res.vehicle) {
          toast.success("Vehicle added to fleet successfully.");
          setVehicles((prev) => [res.vehicle, ...prev]);
          setModalMode(null);
        } else {
          setModalError(res.message || "Failed to add vehicle.");
        }
      } else {
        const vid = editingVehicle._id;
        const res = await api.updateVehicle(vid, formData);
        if (res.success && res.vehicle) {
          toast.success("Vehicle details and pricing updated.");
          setVehicles((prev) =>
            prev.map((item) => (item._id === vid ? res.vehicle : item))
          );
          setModalMode(null);
        } else {
          setModalError(res.message || "Failed to update vehicle.");
        }
      }
    } catch (err) {
      setModalError(err.message || "Operation failed. Please verify vehicle data.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Safe Delete / Archive
  const handleDeleteVehicle = async (vid) => {
    setDeletingId(vid);
    try {
      const res = await api.deleteVehicle(vid);
      if (res.success) {
        if (res.archived) {
          toast.info("Vehicle has past bookings and was safely archived to protect historical records.");
          setVehicles((prev) =>
            prev.map((v) => (v._id === vid ? { ...v, isArchived: true, available: false } : v))
          );
        } else {
          toast.success("Vehicle removed from fleet database.");
          setVehicles((prev) => prev.filter((v) => v._id !== vid));
        }
      } else {
        toast.error(res.message || "Unable to remove vehicle.");
      }
    } catch (err) {
      toast.error(err.message || "Delete operation failed.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Fleet Inventory
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Vehicle Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage specifications, daily rental tariffs, vehicle images, and operational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchVehicles}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by model or brand..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none font-semibold text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="SUV">SUV</option>
            <option value="Sedan">Sedan</option>
            <option value="Hatchback">Hatchback</option>
            <option value="MUV">MUV</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Fuel / Gear</th>
                <th className="py-3 px-3">Seats</th>
                <th className="py-3 px-3">Daily Tariff</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <span>Loading vehicle fleet...</span>
                  </td>
                </tr>
              ) : paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.image || "https://placehold.co/100x70/e2e8f0/334155?text=Car"}
                          alt={v.name}
                          className="w-12 h-8 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{v.name}</span>
                            {v.isArchived && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-bold uppercase">
                                Archived
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{v.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{v.type}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {v.fuel} • {v.transmission}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{v.seats || 5}</td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      ₹{Number(v.pricePerDay || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{v.rating || 4.0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          v.isArchived
                            ? "bg-slate-100 text-slate-600"
                            : v.available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {v.isArchived ? "Archived" : v.available ? "Available" : "Rented"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Vehicle & Rates"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === v._id}
                          onClick={() => handleDeleteVehicle(v._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Safe Archive or Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages} ({filteredVehicles.length} total cars)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Fleet Configuration
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === "add" ? "Add New Vehicle to Fleet" : `Edit Vehicle: ${editingVehicle?.name}`}
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 overflow-y-auto space-y-4">
              {modalError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Model Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexon, Swift, Creta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Brand *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata, Maruti Suzuki, Hyundai"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-semibold"
                  >
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="MUV">MUV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fuel</label>
                  <select
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Model Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2025"
                    value={formData.modelYear}
                    onChange={(e) => setFormData({ ...formData, modelYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://commons.wikimedia.org/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mileage Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. 18.5 km/l"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Engine Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. 1498 cc"
                    value={formData.engineCapacity}
                    onChange={(e) => setFormData({ ...formData, engineCapacity: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Luggage Space</label>
                  <input
                    type="text"
                    placeholder="e.g. 380 Liters"
                    value={formData.luggageCapacity}
                    onChange={(e) => setFormData({ ...formData, luggageCapacity: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of vehicle features, driving dynamics, and usage recommendation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="availCheck" className="text-xs font-semibold text-slate-700">
                  Mark as Available for Customer Reservations
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === "add" ? "Save to Fleet" : "Update Vehicle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
