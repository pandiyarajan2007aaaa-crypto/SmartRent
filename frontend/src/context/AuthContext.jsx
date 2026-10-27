import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getStoredUser, getAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getAuthToken);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" | "register"

  useEffect(() => {
    if (user) {
      localStorage.setItem("smartrentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("smartrentUser");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("smartrentToken", token);
    } else {
      localStorage.removeItem("smartrentToken");
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.success && data.user) {
      const loggedUser = {
        _id: data.user.id || data.user._id,
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      setUser(loggedUser);
      setToken(data.token);
      setAuthModalOpen(false);
      return loggedUser;
    }
    throw new Error(data.message || "Login failed");
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    if (data.user) {
      // Automatically login after successful registration or prompt login
      return data;
    }
    throw new Error(data.message || "Registration failed");
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("smartrentUser");
    localStorage.removeItem("smartrentToken");
  };

  const openLogin = () => {
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode("register");
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openLogin,
        openRegister,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
