import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import ProductDetailPage from './pages/ProductDetailPage';
import MerchandisingPage from './pages/MerchandisingPage';
import EditorialLandingPage from './pages/EditorialLandingPage';
import InfoPage from './pages/InfoPage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import useAuthStore from './store/authStore';
import './index.css';

function AdminRoute() {
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

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/new-in" element={<MerchandisingPage pageKey="new-in" />} />
            <Route path="/bestsellers" element={<MerchandisingPage pageKey="bestsellers" />} />
            <Route path="/sale" element={<MerchandisingPage pageKey="sale" />} />
            <Route path="/campaigns/:slug" element={<EditorialLandingPage sectionKey="campaigns" />} />
            <Route path="/lookbook/:slug" element={<EditorialLandingPage sectionKey="lookbook" />} />
            <Route path="/occasions/:slug" element={<EditorialLandingPage sectionKey="occasions" />} />
            <Route path="/about" element={<InfoPage pageKey="about" />} />
            <Route path="/size-guide" element={<InfoPage pageKey="size-guide" />} />
            <Route path="/delivery" element={<InfoPage pageKey="delivery" />} />
            <Route path="/returns" element={<InfoPage pageKey="returns" />} />
            <Route path="/faq" element={<InfoPage pageKey="faq" />} />
            <Route path="/contact" element={<InfoPage pageKey="contact" />} />
            <Route path="/track-order" element={<InfoPage pageKey="track-order" />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminRoute />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
