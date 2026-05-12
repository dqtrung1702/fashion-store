import { create } from 'zustand';
import {
  editorialPages,
  footerGroups,
  homePageContent,
  infoPages,
  merchandisingPages,
  navigationGroups,
} from '../data/publicContent';
import {
  editorialPages as editorialPagesEn,
  footerGroups as footerGroupsEn,
  homePageContent as homePageContentEn,
  infoPages as infoPagesEn,
  merchandisingPages as merchandisingPagesEn,
  navigationGroups as navigationGroupsEn,
} from '../data/publicContent.en';
import { adminService, contentService } from '../services';
import { DEFAULT_LOCALE, LANGUAGE_STORAGE_KEY, SUPPORTED_LOCALES } from './languageStore';

const clone = (value) => JSON.parse(JSON.stringify(value));
const DEFAULT_BACKGROUND_IMAGE = '';
const GLOBAL_SITE_CHROME_FIELDS = ['backgroundImage'];

const localizedDefaults = {
  vi: {
    navigationGroups,
    footerGroups,
    merchandisingPages,
    editorialPages,
    homePageContent,
    infoPages,
    siteChrome: {
      brandName: 'Áo Dài Rạng Rỡ',
      announcement: 'Nhận đơn áo dài số lượng cho Tết, hội hè, trường lớp và hoạt động tập thể.',
      footerHeading: 'Áo dài phổ thông dễ mặc, dễ đặt theo nhóm.',
      footerDescription:
        'Chọn áo dài lễ hội, đồng phục tập thể, trường lớp, chụp ảnh và mẫu cơ bản số lượng sẵn với mức giá dễ duyệt.',
      storeHoldDurationLabel: '24h',
      backgroundImage: DEFAULT_BACKGROUND_IMAGE,
    },
    hero: {
      eyebrow: 'Áo dài phổ thông theo số lượng',
      title: 'Áo dài dễ mặc cho Tết, hội hè và hoạt động tập thể.',
      description:
        'Catalog tập trung vào mẫu giá vừa phải, phom thoải mái, màu dễ đồng bộ và phương án đặt nhiều bộ cho nhóm, lớp, cơ quan hoặc chương trình theo mùa.',
      primaryCtaLabel: 'Xem catalog số lượng',
      primaryCtaTo: '/collections/co-ban-so-luong',
      secondaryCtaLabel: 'Xem áo dài lễ hội',
      secondaryCtaTo: '/collections/le-hoi-tet',
    },
    heroStats: [
      {
        label: 'Size',
        value: 'XS-XXL',
        detail: 'Dễ chia size cho nhóm, lớp và đội hình sự kiện.',
      },
      {
        label: 'Tồn sẵn',
        value: '100+ / mẫu',
        detail: 'Các mẫu core có số lượng để chốt đơn nhanh hơn.',
      },
      {
        label: 'Nhu cầu',
        value: '5 catalog',
        detail: 'Tết, đồng phục, trường lớp, chụp ảnh và mẫu cơ bản.',
      },
    ],
    campaignBanner: {
      eyebrow: 'Đặt theo dịp',
      title: 'Áo Dài Hội Hè: vui, gần gũi và dễ mặc đồng bộ.',
      description:
        'Một hướng catalog dành cho khách cần nhiều bộ áo dài phổ thông cho Tết, hội xuân, văn nghệ hoặc hoạt động cộng đồng.',
      to: '/campaigns/ao-dai-hoi-he',
      ctaLabel: 'Khám phá áo dài hội hè',
    },
  },
  en: {
    navigationGroups: navigationGroupsEn,
    footerGroups: footerGroupsEn,
    merchandisingPages: merchandisingPagesEn,
    editorialPages: editorialPagesEn,
    homePageContent: homePageContentEn,
    infoPages: infoPagesEn,
    siteChrome: {
      brandName: 'Radiant Ao Dai',
      announcement: 'Bulk ao dai orders for Tet, festivals, schools and group activities.',
      footerHeading: 'Everyday ao dai that are easy to wear and easy to order in groups.',
      footerDescription:
        'Choose festival, group uniform, school, photo and ready basic ao dai with practical pricing.',
      storeHoldDurationLabel: '24h',
      backgroundImage: DEFAULT_BACKGROUND_IMAGE,
    },
    hero: {
      eyebrow: 'Everyday ao dai for bulk orders',
      title: 'Ao dai for Tet, festivals and group activities.',
      description:
        'A catalog focused on accessible pricing, comfortable fits, coordinated colors and multi-piece orders for groups, classes, offices and seasonal programs.',
      primaryCtaLabel: 'Shop bulk basics',
      primaryCtaTo: '/collections/co-ban-so-luong',
      secondaryCtaLabel: 'Shop festival ao dai',
      secondaryCtaTo: '/collections/le-hoi-tet',
    },
    heroStats: [
      {
        label: 'Sizes',
        value: 'XS-XXL',
        detail: 'Easier planning for teams, classes and event groups.',
      },
      {
        label: 'Ready stock',
        value: '100+ / style',
        detail: 'Core styles support faster order confirmation.',
      },
      {
        label: 'Needs',
        value: '5 catalogs',
        detail: 'Tet, uniforms, schools, photos and ready basics.',
      },
    ],
    campaignBanner: {
      eyebrow: 'Shop by occasion',
      title: 'Festival Ao Dai: cheerful, familiar and easy to coordinate.',
      description:
        'A catalog direction for customers ordering everyday ao dai for Tet, spring fairs, performances and community events.',
      to: '/campaigns/ao-dai-hoi-he',
      ctaLabel: 'Explore festival ao dai',
    },
  },
};

const getStoredLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
};

const pickEditableFields = (value = {}) => ({
  siteChrome: clone(value.siteChrome || {}),
  homePageContent: clone(value.homePageContent || {}),
  merchandisingPages: clone(value.merchandisingPages || {}),
  editorialPages: clone(value.editorialPages || {}),
  infoPages: clone(value.infoPages || {}),
});

const getRemoteForLocale = (remote = {}, locale = DEFAULT_LOCALE) => {
  if (remote?.locales?.[locale]) return remote.locales[locale];
  if (locale === DEFAULT_LOCALE) return remote;
  return {};
};

const buildInitialContent = (locale = DEFAULT_LOCALE) => {
  const defaults = localizedDefaults[locale] || localizedDefaults[DEFAULT_LOCALE];

  return {
  siteChrome: {
    ...clone(defaults.siteChrome),
  },
  navigationGroups: clone(defaults.navigationGroups),
  footerGroups: clone(defaults.footerGroups),
  merchandisingPages: clone(defaults.merchandisingPages),
  editorialPages: clone(defaults.editorialPages),
  homePageContent: {
    ...clone(defaults.homePageContent),
    hero: {
      ...clone(defaults.hero),
    },
    heroStats: clone(defaults.heroStats),
    campaignBanner: {
      ...clone(defaults.campaignBanner),
    },
  },
  infoPages: clone(defaults.infoPages),
};
};

const buildEditableBundle = (state) => {
  const locale = state.locale || DEFAULT_LOCALE;
  const currentLocaleBundle = pickEditableFields(state);
  const remoteBundle = clone(state.remoteBundle || {});
  const existingTopLevel = pickEditableFields(remoteBundle);
  const fallbackViBundle = pickEditableFields(buildInitialContent(DEFAULT_LOCALE));
  const viBundle =
    locale === DEFAULT_LOCALE
      ? currentLocaleBundle
      : hasRemoteContent(remoteBundle?.locales?.[DEFAULT_LOCALE])
      ? pickEditableFields(remoteBundle.locales[DEFAULT_LOCALE])
      : hasRemoteContent(existingTopLevel)
      ? existingTopLevel
      : fallbackViBundle;
  const locales = SUPPORTED_LOCALES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry]:
        entry === locale
          ? currentLocaleBundle
          : hasRemoteContent(remoteBundle.locales?.[entry])
          ? pickEditableFields(remoteBundle.locales[entry])
          : entry === DEFAULT_LOCALE
          ? viBundle
          : pickEditableFields(buildInitialContent(entry)),
    }),
    {}
  );
  const globalSiteChrome = GLOBAL_SITE_CHROME_FIELDS.reduce((acc, field) => {
    if (currentLocaleBundle.siteChrome[field] !== undefined) {
      acc[field] = currentLocaleBundle.siteChrome[field];
    }
    return acc;
  }, {});
  const syncedLocales = SUPPORTED_LOCALES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry]: {
        ...locales[entry],
        siteChrome: {
          ...(locales[entry]?.siteChrome || {}),
          ...globalSiteChrome,
        },
      },
    }),
    {}
  );
  const syncedViBundle = {
    ...viBundle,
    siteChrome: {
      ...(viBundle.siteChrome || {}),
      ...globalSiteChrome,
    },
  };

  if (locale === DEFAULT_LOCALE) {
    return {
      ...currentLocaleBundle,
      siteChrome: {
        ...(currentLocaleBundle.siteChrome || {}),
        ...globalSiteChrome,
      },
      locales: syncedLocales,
    };
  }

  return {
    ...syncedViBundle,
    locales: syncedLocales,
  };
};

const mergeInfoPages = (basePages = {}, remotePages = {}) =>
  Object.keys({ ...basePages, ...remotePages }).reduce(
    (merged, key) => ({
      ...merged,
      [key]: {
        ...(basePages[key] || {}),
        ...(remotePages[key] || {}),
      },
    }),
    {}
  );

const mergeContentState = (base, remote = {}) => ({
  ...base,
  siteChrome: {
    ...base.siteChrome,
    ...(remote.siteChrome || {}),
  },
  merchandisingPages: {
    ...base.merchandisingPages,
    ...(remote.merchandisingPages || {}),
  },
  editorialPages: {
    ...base.editorialPages,
    ...(remote.editorialPages || {}),
  },
  homePageContent: {
    ...base.homePageContent,
    ...(remote.homePageContent || {}),
    hero: {
      ...base.homePageContent.hero,
      ...(remote.homePageContent?.hero || {}),
    },
    heroStats: remote.homePageContent?.heroStats || base.homePageContent.heroStats,
    sectionControls: {
      ...base.homePageContent.sectionControls,
      ...(remote.homePageContent?.sectionControls || {}),
    },
    campaignBanner: {
      ...base.homePageContent.campaignBanner,
      ...(remote.homePageContent?.campaignBanner || {}),
    },
    uspItems: remote.homePageContent?.uspItems || base.homePageContent.uspItems,
    occasions: remote.homePageContent?.occasions || base.homePageContent.occasions,
    reviews: remote.homePageContent?.reviews || base.homePageContent.reviews,
    newsletter: {
      ...base.homePageContent.newsletter,
      ...(remote.homePageContent?.newsletter || {}),
    },
    ugcPosts: remote.homePageContent?.ugcPosts || base.homePageContent.ugcPosts,
  },
  infoPages: mergeInfoPages(base.infoPages, remote.infoPages || {}),
});

const hasRemoteContent = (remote = {}) =>
  ['siteChrome', 'homePageContent', 'merchandisingPages', 'editorialPages', 'infoPages'].some(
    (key) => Object.keys(remote?.[key] || {}).length > 0
  );

const buildStateFromRemote = (remoteBundle, locale = DEFAULT_LOCALE) => {
  const localizedRemote = getRemoteForLocale(remoteBundle, locale);
  const fallback = buildInitialContent(locale);

  if (!hasRemoteContent(localizedRemote)) {
    return fallback;
  }

  return mergeContentState(fallback, localizedRemote);
};

const initialLocale = getStoredLocale();
const initialState = buildInitialContent(initialLocale);

const persistEditableContent = async (set, state, nextState, errorMessage) => {
  try {
    const { data } = await adminService.importContent(buildEditableBundle(nextState));
    const merged = buildStateFromRemote(data, state.locale);
    set({
      ...merged,
      locale: state.locale,
      remoteBundle: data,
      loading: false,
      source: 'remote',
      hydrated: true,
      error: '',
    });
    return { ok: true, source: 'remote' };
  } catch (error) {
    return { ok: false, error: error?.response?.data?.detail || errorMessage };
  }
};

const useContentStore = create((set, get) => ({
  ...initialState,
  locale: initialLocale,
  remoteBundle: null,
  loading: false,
  error: '',
  source: 'local',
  hydrated: false,

  setLocale: (locale) => {
    const nextLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    const state = get();
    const remoteBundle = state.remoteBundle;
    const nextContent =
      state.source === 'remote' && remoteBundle
        ? buildStateFromRemote(remoteBundle, nextLocale)
        : buildInitialContent(nextLocale);

    set({
      ...nextContent,
      locale: nextLocale,
      remoteBundle,
      loading: false,
      hydrated: state.hydrated,
      source: state.source,
      error: '',
    });
  },

  loadContent: async (force = false) => {
    const state = get();
    if (state.loading) return { ok: true, source: state.source };
    if (state.hydrated && !force) return { ok: true, source: state.source };

    set({ loading: true, error: '' });

    try {
      const { data } = await contentService.get();
      const localizedRemote = getRemoteForLocale(data, state.locale);
      if (!hasRemoteContent(localizedRemote)) {
        const fallback = buildInitialContent(state.locale);
        set({
          ...fallback,
          locale: state.locale,
          remoteBundle: data,
          loading: false,
          hydrated: true,
          source: hasRemoteContent(data) ? 'remote' : 'local',
          error: '',
        });
        return { ok: true, source: 'local', empty: true };
      }

      const merged = mergeContentState(buildInitialContent(state.locale), localizedRemote);
      set({
        ...merged,
        locale: state.locale,
        remoteBundle: data,
        loading: false,
        hydrated: true,
        source: 'remote',
        error: '',
      });
      return { ok: true, source: 'remote' };
    } catch (error) {
      const fallback = buildInitialContent(state.locale);
      set({
        ...fallback,
        locale: state.locale,
        remoteBundle: null,
        loading: false,
        hydrated: true,
        source: 'local',
        error: error?.response?.data?.detail || 'Không thể tải content từ backend. Đang dùng fallback nội dung tạm thời.',
      });
      return { ok: false, error: error?.response?.data?.detail || 'Không thể tải content từ backend.' };
    }
  },

  importContentToBackend: async () => {
    try {
      await adminService.importContent(buildEditableBundle(get()));
      return await get().loadContent(true);
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể import content lên backend.' };
    }
  },

  updateSiteChrome: async (payload) => {
    const state = get();
    const nextState = {
      ...state,
      siteChrome: {
        ...state.siteChrome,
        ...payload,
      },
    };

    return persistEditableContent(set, state, nextState, 'Không thể lưu site chrome lên backend.');
  },

  updateHomePageContent: async (payload) => {
    const state = get();
    const nextState = {
      ...state,
      homePageContent: {
        ...state.homePageContent,
        ...payload,
      },
    };

    return persistEditableContent(set, state, nextState, 'Không thể lưu trang chủ lên backend.');
  },

  updateMerchandisingPage: async (pageKey, payload) => {
    const state = get();
    const nextState = {
      ...state,
      merchandisingPages: {
        ...state.merchandisingPages,
        [pageKey]: {
          ...state.merchandisingPages[pageKey],
          ...payload,
        },
      },
    };

    return persistEditableContent(set, state, nextState, 'Không thể lưu landing page lên backend.');
  },

  updateEditorialPage: async (sectionKey, slug, payload) => {
    const state = get();
    const nextState = {
      ...state,
      editorialPages: {
        ...state.editorialPages,
        [sectionKey]: {
          ...state.editorialPages[sectionKey],
          [slug]: {
            ...state.editorialPages[sectionKey]?.[slug],
            ...payload,
          },
        },
      },
    };

    return persistEditableContent(set, state, nextState, 'Không thể lưu bài editorial lên backend.');
  },

  updateInfoPage: async (pageKey, payload) => {
    const state = get();
    const nextState = {
      ...state,
      infoPages: {
        ...state.infoPages,
        [pageKey]: {
          ...state.infoPages[pageKey],
          ...payload,
        },
      },
    };

    return persistEditableContent(set, state, nextState, 'Không thể lưu trang thông tin lên backend.');
  },

  resetContent: async () => {
    const state = get();
    const fallback = buildInitialContent(state.locale);

    return persistEditableContent(
      set,
      state,
      { ...state, ...fallback },
      'Không thể reset content trên backend.'
    );
  },

  getEditorialPage: (sectionKey, slug) => get().editorialPages?.[sectionKey]?.[slug],
  getInfoPage: (pageKey) => get().infoPages?.[pageKey],
  getMerchandisingPage: (pageKey) => get().merchandisingPages?.[pageKey],
}));

export const contentOptionEntries = {
  merchandising: [
    { key: 'new-in', label: 'Mới về' },
    { key: 'bestsellers', label: 'Bán chạy' },
    { key: 'sale', label: 'Giảm giá' },
  ],
  editorial: [
    { sectionKey: 'campaigns', slug: 'ao-dai-hoi-he', label: 'Chiến dịch / Áo Dài Hội Hè' },
    { sectionKey: 'lookbook', slug: 'dong-phuc-tap-the', label: 'Lookbook / Đồng Phục Tập Thể' },
    { sectionKey: 'occasions', slug: 'tet-hoi-xuan', label: 'Dịp mặc / Tết & Hội Xuân' },
  ],
  info: [
    { key: 'about', label: 'Về thương hiệu' },
    { key: 'size-guide', label: 'Hướng dẫn size' },
    { key: 'delivery', label: 'Giao hàng' },
    { key: 'returns', label: 'Đổi trả' },
    { key: 'faq', label: 'FAQ' },
    { key: 'contact', label: 'Liên hệ' },
    { key: 'track-order', label: 'Theo dõi đơn' },
  ],
};

export const getInitialContentSnapshot = () => clone(buildInitialContent());

export default useContentStore;
