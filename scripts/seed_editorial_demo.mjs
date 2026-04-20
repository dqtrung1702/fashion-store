const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

const contentFields = ['siteChrome', 'homePageContent', 'merchandisingPages', 'editorialPages', 'infoPages'];
const editorialImages = {
  campaign: 'https://images.pexels.com/photos/36214254/pexels-photo-36214254.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
  lookbook: 'https://images.pexels.com/photos/32279111/pexels-photo-32279111.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
  occasion: 'https://images.pexels.com/photos/35146267/pexels-photo-35146267.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
};

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status} ${body}`);
  }

  return body ? JSON.parse(body) : {};
};

const login = async () =>
  requestJson(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

const getCurrentContent = async () => requestJson(`${API_BASE_URL}/api/content/`);

const getCollections = async () => {
  try {
    return await requestJson(`${API_BASE_URL}/api/products/collections?active_only=true`);
  } catch {
    return [];
  }
};

const collectionLink = (collections, preferredSlugs = [], fallbackIndex = 0) => {
  const preferred = collections.find((collection) => preferredSlugs.includes(collection.slug));
  const fallback = preferred || collections[fallbackIndex] || collections[0];
  return fallback ? `/collections/${fallback.slug}` : '/new-in';
};

const buildEditorialDemo = (collections) => ({
  vi: {
    campaigns: {
      'ao-dai-hoi-he': {
        eyebrow: 'Chiến dịch',
        title: 'Áo dài hội hè rạng rỡ',
        description:
          'Một câu chuyện hình ảnh dành cho những buổi gặp gỡ, hội hè và sự kiện cần vẻ mềm mại nhưng vẫn dễ đặt theo số lượng.',
        image: editorialImages.campaign,
        bullets: ['Màu sáng dễ lên hình', 'Phom mềm cho nhiều dáng', 'Dễ đặt theo nhóm'],
        cta: {
          label: 'Xem danh mục phù hợp',
          to: collectionLink(collections, ['dresses', 'occasionwear'], 3),
        },
      },
    },
    lookbook: {
      'dong-phuc-tap-the': {
        eyebrow: 'Lookbook',
        title: 'Đồng phục tập thể mềm mại',
        description:
          'Gợi ý phối áo dài cho nhóm, lớp hoặc đội hình sự kiện: màu đồng bộ, phom dễ chia size và ảnh tổng thể gọn mắt.',
        image: editorialImages.lookbook,
        bullets: ['Chia size theo danh sách', 'Bảng màu đồng bộ', 'Ảnh nhóm gọn mắt'],
        cta: {
          label: 'Xem mẫu cho nhóm',
          to: collectionLink(collections, ['outerwear', 'dresses'], 0),
        },
      },
    },
    occasions: {
      'tet-hoi-xuan': {
        eyebrow: 'Theo dịp',
        title: 'Tết & Hội Xuân',
        description:
          'Các mẫu áo dài có sắc đỏ, hồng, vàng và chất liệu nhẹ cho ngày đầu năm, hội xuân, văn nghệ hoặc ảnh gia đình.',
        image: editorialImages.occasion,
        bullets: ['Sắc màu ấm áp', 'Dễ mặc cho nhiều độ tuổi', 'Lên hình gần gũi'],
        cta: {
          label: 'Xem mẫu mùa lễ',
          to: collectionLink(collections, ['occasionwear', 'dresses'], 4),
        },
      },
    },
  },
  en: {
    campaigns: {
      'ao-dai-hoi-he': {
        eyebrow: 'Campaign',
        title: 'Radiant Festival Ao Dai',
        description:
          'A visual story for gatherings, spring fairs and group events that need a soft look while staying simple to order in quantity.',
        image: editorialImages.campaign,
        bullets: ['Camera-friendly colors', 'Soft fits for many body types', 'Easy group ordering'],
        cta: {
          label: 'Shop the matching catalog',
          to: collectionLink(collections, ['dresses', 'occasionwear'], 3),
        },
      },
    },
    lookbook: {
      'dong-phuc-tap-the': {
        eyebrow: 'Lookbook',
        title: 'Soft Group Uniforms',
        description:
          'Styling guidance for classes, teams and event groups: coordinated colors, easier size planning and a polished group photo.',
        image: editorialImages.lookbook,
        bullets: ['Size planning by list', 'Coordinated palettes', 'Clean group photos'],
        cta: {
          label: 'Shop group styles',
          to: collectionLink(collections, ['outerwear', 'dresses'], 0),
        },
      },
    },
    occasions: {
      'tet-hoi-xuan': {
        eyebrow: 'Occasion',
        title: 'Tet & Spring Fairs',
        description:
          'Red, pink, yellow and light-fabric ao dai for the new year, spring fairs, performances and family photos.',
        image: editorialImages.occasion,
        bullets: ['Warm festive colors', 'Easy for many ages', 'Friendly on camera'],
        cta: {
          label: 'Shop festive styles',
          to: collectionLink(collections, ['occasionwear', 'dresses'], 4),
        },
      },
    },
  },
});

const mergeEditorialPages = (current = {}, demo = {}) => ({
  ...clone(current),
  campaigns: {
    ...(current.campaigns || {}),
    ...(demo.campaigns || {}),
  },
  lookbook: {
    ...(current.lookbook || {}),
    ...(demo.lookbook || {}),
  },
  occasions: {
    ...(current.occasions || {}),
    ...(demo.occasions || {}),
  },
});

const mergeLocale = (localeContent = {}, demo = {}) => ({
  ...clone(localeContent),
  editorialPages: mergeEditorialPages(localeContent.editorialPages, demo),
});

const buildPayload = (current, demo) => {
  const payload = Object.fromEntries(contentFields.map((field) => [field, clone(current[field])]));

  payload.editorialPages = mergeEditorialPages(payload.editorialPages, demo.vi);
  payload.locales = {
    ...clone(current.locales),
    vi: mergeLocale(current.locales?.vi, demo.vi),
    en: mergeLocale(current.locales?.en, demo.en),
  };

  return payload;
};

const importContent = async (token, payload) =>
  requestJson(`${API_BASE_URL}/api/admin/content/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

const main = async () => {
  const [current, collections] = await Promise.all([getCurrentContent(), getCollections()]);
  const demo = buildEditorialDemo(collections);
  const payload = buildPayload(current, demo);

  if (process.argv.includes('--print')) {
    process.stdout.write(JSON.stringify(payload.editorialPages, null, 2));
    return;
  }

  const auth = await login();
  const result = await importContent(auth.access_token, payload);

  console.log(
    JSON.stringify(
      {
        imported: ['campaigns/ao-dai-hoi-he', 'lookbook/dong-phuc-tap-the', 'occasions/tet-hoi-xuan'],
        locales: Object.keys(result.locales || {}),
        activeCollectionsUsed: collections.map((collection) => collection.slug),
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
