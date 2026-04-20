import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { localizeEntity } from '../../i18n/entities';
import { getUiText } from '../../i18n/ui';
import useAuthStore from '../../store/authStore';
import useCatalogStore from '../../store/catalogStore';
import useCartStore from '../../store/cartStore';
import useContentStore from '../../store/contentStore';
import useLanguageStore from '../../store/languageStore';
import useWishlistStore from '../../store/wishlistStore';

const navClassName = ({ isActive }) =>
  `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_10px_24px_rgba(166,99,91,0.08)] backdrop-blur transition duration-200 ${
    isActive
      ? 'border-[#c97968] bg-[linear-gradient(135deg,#f4ddda,#f4e8c7)] text-[#8f514a] shadow-[0_14px_30px_rgba(166,99,91,0.14)]'
      : 'border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(244,232,199,0.54))] text-slate-700 hover:-translate-y-0.5 hover:border-[#c97968] hover:bg-[linear-gradient(135deg,#ffffff,#f2d7d2)] hover:text-[#8f514a] hover:shadow-[0_14px_30px_rgba(166,99,91,0.13)]'
  }`;

const actionButtonClass =
  'rounded-full border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(223,233,228,0.54))] px-4 py-2 text-slate-700 shadow-[0_10px_24px_rgba(166,99,91,0.08)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#c97968] hover:bg-[linear-gradient(135deg,#ffffff,#f4ddda)] hover:text-[#8f514a] hover:shadow-[0_14px_30px_rgba(166,99,91,0.13)]';

const VietnamFlag = () => (
  <svg viewBox="0 0 36 24" className="h-5 w-7 rounded-[3px] shadow-sm" aria-hidden="true">
    <rect width="36" height="24" fill="#da251d" />
    <path
      fill="#ffde00"
      d="M18 5.1l1.7 5.1h5.4l-4.4 3.2 1.7 5.1-4.4-3.2-4.4 3.2 1.7-5.1-4.4-3.2h5.4L18 5.1z"
    />
  </svg>
);

const UnitedStatesFlag = () => (
  <svg viewBox="0 0 38 24" className="h-5 w-7 rounded-[3px] shadow-sm" aria-hidden="true">
    <rect width="38" height="24" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((row) => (
      <rect key={row} y={(row * 24) / 13} width="38" height={24 / 13} fill="#b22234" />
    ))}
    <rect width="15.2" height="12.9" fill="#3c3b6e" />
    {Array.from({ length: 20 }).map((_, index) => {
      const column = index % 5;
      const row = Math.floor(index / 5);
      return (
        <circle
          key={index}
          cx={2.2 + column * 2.6}
          cy={2 + row * 2.7}
          r="0.45"
          fill="#fff"
        />
      );
    })}
  </svg>
);

const languageOptions = [
  { locale: 'vi', Flag: VietnamFlag, label: 'Tiếng Việt' },
  { locale: 'en', Flag: UnitedStatesFlag, label: 'English' },
];

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);
  const collections = useCatalogStore((state) => state.collections);
  const navigationGroups = useContentStore((state) => state.navigationGroups);
  const siteChrome = useContentStore((state) => state.siteChrome);
  const setContentLocale = useContentStore((state) => state.setLocale);
  const locale = useLanguageStore((state) => state.locale);
  const setLanguageLocale = useLanguageStore((state) => state.setLocale);
  const cartCount = useCartStore((state) => state.getCount());
  const clearWishlist = useWishlistStore((state) => state.clear);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const loginHref = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  const shopLinks = collections
    .filter((collection) => collection.isActive !== false)
    .map((collection) => {
      const localizedCollection = localizeEntity(collection, locale);
      return {
        label: localizedCollection.title,
        to: `/collections/${collection.slug}`,
      };
    });

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Local logout is still enough for this frontend-first stage.
    }

    logout();
    await Promise.allSettled([clearCart(), clearWishlist()]);
    navigate('/', { replace: true });
  };

  const handleLocaleChange = (nextLocale) => {
    setLanguageLocale(nextLocale);
    setContentLocale(nextLocale);
  };

  const languageSwitch = (
    <div
      className="relative grid h-9 w-[84px] grid-cols-2 rounded-lg border border-[#d8b9ad] bg-[#fffaf4] p-1 shadow-[0_10px_24px_rgba(143,81,74,0.12)]"
      aria-label={getUiText(locale, 'language')}
    >
      <span
        className={`pointer-events-none absolute left-1 top-1 h-7 w-[36px] rounded-md bg-[linear-gradient(135deg,#c97968,#8f514a)] shadow-[0_8px_18px_rgba(143,81,74,0.24)] transition-transform duration-300 ${
          locale === 'en' ? 'translate-x-[40px]' : 'translate-x-0'
        }`}
        aria-hidden="true"
      />
      {languageOptions.map((option) => (
        <button
          key={option.locale}
          type="button"
          onClick={() => handleLocaleChange(option.locale)}
          className={`relative z-10 flex h-7 items-center justify-center rounded-md transition duration-200 ${
            locale === option.locale
              ? 'text-white'
              : 'text-[#8f514a] hover:bg-[#f4ddda] hover:text-[#6f3832]'
          }`}
          aria-pressed={locale === option.locale}
          aria-label={`${getUiText(locale, 'language')} ${option.label}`}
          title={option.label}
        >
          <option.Flag />
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/" className="block truncate font-display text-3xl leading-none text-slate-950 md:text-4xl">
              {siteChrome.brandName}
            </Link>
            {siteChrome.announcement ? (
              <p className="mt-2 max-w-3xl truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {siteChrome.announcement}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-sm font-semibold">
            {isAuthenticated && user?.is_admin ? (
              <Link to="/admin" className="rounded-full border border-[#c97968] bg-[linear-gradient(135deg,#ffffff,#f4e8c7)] px-4 py-2 text-[#8f514a] shadow-[0_10px_24px_rgba(166,99,91,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#f4ddda,#f4e8c7)] hover:shadow-[0_14px_30px_rgba(166,99,91,0.13)]">
                {getUiText(locale, 'admin')}
              </Link>
            ) : null}
            {languageSwitch}
            <Link to="/wishlist" className={actionButtonClass}>
              {getUiText(locale, 'wishlist')} ({wishlistCount})
            </Link>
            <Link to="/cart" className={actionButtonClass}>
              {getUiText(locale, 'cart')} ({cartCount})
            </Link>
            <Link to="/account" className={actionButtonClass}>
              {isAuthenticated ? user?.full_name || user?.username : getUiText(locale, 'account')}
            </Link>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className={actionButtonClass}>
                {getUiText(locale, 'logout')}
              </button>
            ) : (
              <Link to={loginHref} className="rounded-full bg-[linear-gradient(135deg,#c97968,#a95d51)] px-4 py-2 text-white shadow-[0_12px_28px_rgba(166,99,91,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(166,99,91,0.22)]">
                {getUiText(locale, 'login')}
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {shopLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {navigationGroups.support.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
