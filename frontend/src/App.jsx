// ============================================================
// App.jsx
// Defines all the page routes for the application and wraps
// everything in the AuthProvider so login state is available
// everywhere. AppContent is a separate inner component because
// RouteLoader and the page-fade transition both need
// useLocation(), which only works INSIDE <BrowserRouter> - App
// itself can't call it directly since App is what renders the
// BrowserRouter in the first place.
// ============================================================

import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteLoader from "./components/RouteLoader";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import Sandbox from "./pages/Sandbox";
import Profile from "./pages/Profile";

function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* Slim top progress bar that plays briefly on every navigation */}
      <RouteLoader />

      <Navbar />

      {/* key={location.pathname} forces this element to remount on every
          route change, which replays the page-fade-in CSS animation -
          this is what makes page switches feel smooth instead of a
          sudden jump-cut. */}
      <main className="page page-transition" key={location.pathname}>
        <Routes>
          {/* Public routes - anyone can view these without logging in */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes - require a logged-in user */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons"
            element={
              <ProtectedRoute>
                <Lessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:trackId/:lessonSlug"
            element={
              <ProtectedRoute>
                <LessonDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sandbox"
            element={
              <ProtectedRoute>
                <Sandbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
