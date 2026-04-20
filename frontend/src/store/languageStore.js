import { create } from 'zustand';

export const DEFAULT_LOCALE = 'vi';
export const SUPPORTED_LOCALES = ['vi', 'en'];
export const LANGUAGE_STORAGE_KEY = 'fashion-store-locale';

const readInitialLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
};

const useLanguageStore = create((set) => ({
  locale: readInitialLocale(),
  setLocale: (locale) => {
    const nextLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
      document.documentElement.lang = nextLocale;
    }
    set({ locale: nextLocale });
  },
}));

export default useLanguageStore;
