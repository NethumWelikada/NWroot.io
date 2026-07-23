// ============================================================
// ProtectedRoute.jsx
// Wraps any page that requires the user to be logged in.
// If there's no logged-in user, redirect to the login page
// instead of showing the protected content.
// ============================================================

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
