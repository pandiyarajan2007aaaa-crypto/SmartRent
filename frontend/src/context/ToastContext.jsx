import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg, duration) => addToast(msg, "success", duration),
      error: (msg, duration) => addToast(msg, "error", duration),
      info: (msg, duration) => addToast(msg, "info", duration),
      warning: (msg, duration) => addToast(msg, "warning", duration),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm transition-all duration-300 animate-slideIn ${
              item.type === "success"
                ? "bg-white text-emerald-900 border-emerald-200 shadow-emerald-500/10"
                : item.type === "error"
                ? "bg-white text-rose-900 border-rose-200 shadow-rose-500/10"
                : item.type === "warning"
                ? "bg-white text-amber-900 border-amber-200 shadow-amber-500/10"
                : "bg-white text-slate-800 border-slate-200 shadow-slate-500/10"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {item.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {item.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {item.type === "info" && <Info className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="flex-1 leading-snug font-medium">{item.message}</div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
