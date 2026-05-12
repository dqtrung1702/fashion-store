import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AdminPage from '../pages/AdminPage';
import useAuthStore from '../store/authStore';

export default function AdminRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/account" replace />;
  }

  return <AdminPage />;
}
