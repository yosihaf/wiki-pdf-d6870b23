import React from 'react';
import { Navigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { useAuth } from './useAuth';

export default function AuthGuard({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // אם אין משתמש מחובר, מפנים לדף הבית
    return <Navigate to={createPageUrl("Home")} />;
  }

  if (adminOnly && !isAdmin) {
    // אם הדף דורש הרשאות מנהל והמשתמש אינו מנהל
    return <Navigate to={createPageUrl("WikiPdfGenerator")} />;
  }

  return children;
}