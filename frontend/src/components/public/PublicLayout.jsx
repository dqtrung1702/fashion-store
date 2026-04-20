import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useContentStore from '../../store/contentStore';
import useLanguageStore from '../../store/languageStore';
import useWishlistStore from '../../store/wishlistStore';

export default function PublicLayout() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const siteChrome = useContentStore((state) => state.siteChrome);
  const contentLocale = useContentStore((state) => state.locale);
  const setContentLocale = useContentStore((state) => state.setLocale);
  const contentHydrated = useContentStore((state) => state.hydrated);
  const loadContent = useContentStore((state) => state.loadContent);
  const locale = useLanguageStore((state) => state.locale);
  const loadCart = useCartStore((state) => state.loadCart);
  const loadWishlist = useWishlistStore((state) => state.loadWishlist);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (contentLocale !== locale) {
      setContentLocale(locale);
    }
  }, [contentLocale, locale, setContentLocale]);

  useEffect(() => {
    if (!contentHydrated) {
      loadContent();
    }
  }, [contentHydrated, loadContent]);

  useEffect(() => {
    if (!contentHydrated || location.pathname.startsWith('/admin')) return;
    loadContent(true);
  }, [contentHydrated, loadContent, location.pathname, location.search]);

  useEffect(() => {
    loadCart();
  }, [loadCart, token]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist, token]);

  const backgroundImage = siteChrome?.backgroundImage?.trim().replace(/["\\\n\r]/g, '');
  const themeStyle = backgroundImage
    ? {
        backgroundImage: `var(--site-background-overlay), url("${backgroundImage}")`,
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-slate-900" style={themeStyle}>
      <PublicHeader />
      <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
