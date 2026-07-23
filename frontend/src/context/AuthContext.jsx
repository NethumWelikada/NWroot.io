// ============================================================
// AuthContext.jsx
// Provides login/signup/logout functions and the current user
// to every component in the app, without having to pass props
// down manually through every level ("prop drilling").
// ============================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if a token + user were already saved
  // from a previous session (so refreshing the page doesn't log you out)
  useEffect(() => {
    const savedUser = localStorage.getItem("nwroot_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ------------------------------------------------------------
  // signup: creates a new account, then logs the user in
  // ------------------------------------------------------------
  async function signup(firstName, lastName, email, password) {
    const response = await apiClient.post("/auth/signup", { firstName, lastName, email, password });
    saveSession(response.data.token, response.data.user);
    return response.data;
  }

  // ------------------------------------------------------------
  // login: authenticates an existing user
  // ------------------------------------------------------------
  async function login(email, password) {
    const response = await apiClient.post("/auth/login", { email, password });
    saveSession(response.data.token, response.data.user);
    return response.data;
  }

  // ------------------------------------------------------------
  // logout: clears the saved token/user, both in memory and storage
  // ------------------------------------------------------------
  function logout() {
    localStorage.removeItem("nwroot_token");
    localStorage.removeItem("nwroot_user");
    setUser(null);
  }

  // Helper: saves the JWT + user info after a successful login/signup
  function saveSession(token, userData) {
    localStorage.setItem("nwroot_token", token);
    localStorage.setItem("nwroot_user", JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components can just call: const { user, login } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
