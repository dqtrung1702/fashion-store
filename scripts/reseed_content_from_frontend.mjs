import {
  editorialPages,
  homePageContent,
  infoPages,
  merchandisingPages,
} from '../frontend/src/data/publicContent.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

const clone = (value) => JSON.parse(JSON.stringify(value));

const buildInitialContent = () => ({
  siteChrome: {
    brandName: 'Áo Dài Rạng Rỡ',
    announcement: 'Nhận đơn áo dài số lượng cho Tết, hội hè, trường lớp và hoạt động tập thể.',
    footerHeading: 'Áo dài phổ thông dễ mặc, dễ đặt theo nhóm.',
    footerDescription:
      'Chọn áo dài lễ hội, đồng phục tập thể, trường lớp, chụp ảnh và mẫu cơ bản số lượng sẵn với mức giá dễ duyệt.',
  },
  merchandisingPages: clone(merchandisingPages),
  editorialPages: clone(editorialPages),
  homePageContent: {
    ...clone(homePageContent),
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
  infoPages: clone(infoPages),
});

const login = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
};

const importContent = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/content/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Import failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
};

const main = async () => {
  const payload = buildInitialContent();

  if (process.argv.includes('--print')) {
    process.stdout.write(JSON.stringify(payload, null, 2));
    return;
  }

  const auth = await login();
  const result = await importContent(auth.access_token, payload);

  console.log(
    JSON.stringify(
      {
        sections: Object.keys(payload),
        imported: {
          siteChromeKeys: Object.keys(result.siteChrome || {}).length,
          merchandisingPages: Object.keys(result.merchandisingPages || {}).length,
          editorialSections: Object.keys(result.editorialPages || {}).length,
          infoPages: Object.keys(result.infoPages || {}).length,
        },
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
