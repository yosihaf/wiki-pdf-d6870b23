import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { createPageUrl } from "@/utils";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // הצגת מסך טעינה כאשר בודקים את מצב האימות
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    // אם אין משתמש מחובר, מפנים לדף הבית (במקום Login)
    return <Navigate to={createPageUrl("Home")} />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    // אם הדף דורש הרשאות מנהל והמשתמש אינו מנהל
    return <Navigate to={createPageUrl("WikiPdfGenerator")} />;
  }

  return children;
}