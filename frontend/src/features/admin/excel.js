import {
  INITIAL_COLLECTION_FORM,
  INITIAL_EDITORIAL_FORM,
  INITIAL_HOME_FORM,
  INITIAL_INFO_FORM,
  INITIAL_MERCH_FORM,
} from './constants';
import {
  buildCollectionPayload,
  buildEditorialPayload,
  buildHomePayload,
  buildInfoPayload,
  buildMerchPayload,
  toCollectionForm,
  toEditorialForm,
  toHomeForm,
  toInfoForm,
  toMerchForm,
} from './transformers';

const MARKETING_SHEET = 'Marketing Input';
const COLLECTION_SHEET = 'Danh muc';
const CONTENT_HOME_SHEET = 'Home & Site';
const CONTENT_MERCH_SHEET = 'Merchandising';
const CONTENT_EDITORIAL_SHEET = 'Editorial';
const CONTENT_INFO_SHEET = 'Info Pages';
const META_SHEET = 'Meta';
const GUIDE_SHEET = 'Huong dan';

const COLLECTION_HEADERS = {
  previousSlug: 'Slug cũ',
  slug: 'Slug',
  title: 'Tên danh mục',
  description: 'Mô tả',
  image: 'Ảnh nền danh mục',
  featuredKeywords: 'Từ khóa nổi bật',
  seoHeading: 'SEO heading',
  seoBody: 'SEO body',
  enTitle: 'English title',
  enDescription: 'English description',
  enSeoHeading: 'English SEO heading',
  enSeoBody: 'English SEO body',
  sortPriority: 'Ưu tiên',
  isActive: 'Đang hiển thị',
};

const HOME_HEADERS = {
  brandName: 'Brand name',
  announcement: 'Announcement',
  footerHeading: 'Footer heading',
  footerDescription: 'Footer description',
  storeHoldDurationLabel: 'Store hold duration label',
  backgroundImage: 'Background image',
  heroImage: 'Hero image',
  heroEyebrow: 'Hero eyebrow',
  heroTitle: 'Hero title',
  heroDescription: 'Hero description',
  heroPrimaryCtaLabel: 'Hero primary CTA label',
  heroPrimaryCtaTo: 'Hero primary CTA link',
  heroSecondaryCtaLabel: 'Hero secondary CTA label',
  heroSecondaryCtaTo: 'Hero secondary CTA link',
  heroStats: 'Hero stats',
  sectionControls: 'Homepage blocks',
  campaignEyebrow: 'Campaign eyebrow',
  campaignTitle: 'Campaign title',
  campaignDescription: 'Campaign description',
  campaignTo: 'Campaign link',
  campaignCtaLabel: 'Campaign CTA label',
  uspItems: 'USP items',
  occasions: 'Occasions',
  reviews: 'Reviews',
  newsletterEyebrow: 'Newsletter eyebrow',
  newsletterTitle: 'Newsletter title',
  newsletterDescription: 'Newsletter description',
  ugcPosts: 'UGC posts',
};

const MERCH_HEADERS = {
  key: 'Key',
  label: 'Nhãn',
  eyebrow: 'Eyebrow',
  title: 'Title',
  description: 'Description',
  image: 'Image',
};

const EDITORIAL_HEADERS = {
  sectionKey: 'Section',
  slug: 'Slug',
  label: 'Nhãn',
  eyebrow: 'Eyebrow',
  title: 'Title',
  description: 'Description',
  image: 'Image',
  bullets: 'Bullets',
  ctaLabel: 'CTA label',
  ctaTo: 'CTA link',
};

const INFO_HEADERS = {
  key: 'Key',
  label: 'Nhãn',
  eyebrow: 'Eyebrow',
  title: 'Title',
  intro: 'Intro',
  image: 'Image',
  sections: 'Sections',
  tableHeaders: 'Table headers',
  tableRows: 'Table rows',
  faqs: 'FAQs',
  cards: 'Cards',
  steps: 'Steps',
  mapTitle: 'Map title',
  mapAddress: 'Map address',
  mapCoordinates: 'Map coordinates',
  mapUrl: 'Map url',
  mapEmbedUrl: 'Map embed url',
};

const setSheetCols = (sheet, widths = []) => {
  sheet['!cols'] = widths.map((wch) => ({ wch }));
};

const appendJsonSheet = (XLSX, workbook, name, rows, widths = []) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  if (widths.length) setSheetCols(sheet, widths);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
};

const appendAoaSheet = (XLSX, workbook, name, rows, widths = []) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  if (widths.length) setSheetCols(sheet, widths);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
};

const parseBooleanCell = (value, fallback = true) => {
  if (value === true || value === false) return value;
  const normalized = value?.toString().trim().toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'yes', 'true', 'on', 'co', 'có', 'x'].includes(normalized);
};

const getRowValue = (row, header, fallback = '') => (row?.[header] ?? fallback).toString();

const buildHomeRow = (form) => ({
  [HOME_HEADERS.brandName]: form.brandName,
  [HOME_HEADERS.announcement]: form.announcement,
  [HOME_HEADERS.footerHeading]: form.footerHeading,
  [HOME_HEADERS.footerDescription]: form.footerDescription,
  [HOME_HEADERS.storeHoldDurationLabel]: form.storeHoldDurationLabel,
  [HOME_HEADERS.backgroundImage]: form.backgroundImage,
  [HOME_HEADERS.heroImage]: form.heroImage,
  [HOME_HEADERS.heroEyebrow]: form.heroEyebrow,
  [HOME_HEADERS.heroTitle]: form.heroTitle,
  [HOME_HEADERS.heroDescription]: form.heroDescription,
  [HOME_HEADERS.heroPrimaryCtaLabel]: form.heroPrimaryCtaLabel,
  [HOME_HEADERS.heroPrimaryCtaTo]: form.heroPrimaryCtaTo,
  [HOME_HEADERS.heroSecondaryCtaLabel]: form.heroSecondaryCtaLabel,
  [HOME_HEADERS.heroSecondaryCtaTo]: form.heroSecondaryCtaTo,
  [HOME_HEADERS.heroStats]: form.heroStats,
  [HOME_HEADERS.sectionControls]: form.sectionControls,
  [HOME_HEADERS.campaignEyebrow]: form.campaignEyebrow,
  [HOME_HEADERS.campaignTitle]: form.campaignTitle,
  [HOME_HEADERS.campaignDescription]: form.campaignDescription,
  [HOME_HEADERS.campaignTo]: form.campaignTo,
  [HOME_HEADERS.campaignCtaLabel]: form.campaignCtaLabel,
  [HOME_HEADERS.uspItems]: form.uspItems,
  [HOME_HEADERS.occasions]: form.occasions,
  [HOME_HEADERS.reviews]: form.reviews,
  [HOME_HEADERS.newsletterEyebrow]: form.newsletterEyebrow,
  [HOME_HEADERS.newsletterTitle]: form.newsletterTitle,
  [HOME_HEADERS.newsletterDescription]: form.newsletterDescription,
  [HOME_HEADERS.ugcPosts]: form.ugcPosts,
});

const parseHomeRow = (row = {}) => ({
  ...INITIAL_HOME_FORM,
  brandName: getRowValue(row, HOME_HEADERS.brandName),
  announcement: getRowValue(row, HOME_HEADERS.announcement),
  footerHeading: getRowValue(row, HOME_HEADERS.footerHeading),
  footerDescription: getRowValue(row, HOME_HEADERS.footerDescription),
  storeHoldDurationLabel: getRowValue(row, HOME_HEADERS.storeHoldDurationLabel),
  backgroundImage: getRowValue(row, HOME_HEADERS.backgroundImage),
  heroImage: getRowValue(row, HOME_HEADERS.heroImage),
  heroEyebrow: getRowValue(row, HOME_HEADERS.heroEyebrow),
  heroTitle: getRowValue(row, HOME_HEADERS.heroTitle),
  heroDescription: getRowValue(row, HOME_HEADERS.heroDescription),
  heroPrimaryCtaLabel: getRowValue(row, HOME_HEADERS.heroPrimaryCtaLabel),
  heroPrimaryCtaTo: getRowValue(row, HOME_HEADERS.heroPrimaryCtaTo),
  heroSecondaryCtaLabel: getRowValue(row, HOME_HEADERS.heroSecondaryCtaLabel),
  heroSecondaryCtaTo: getRowValue(row, HOME_HEADERS.heroSecondaryCtaTo),
  heroStats: getRowValue(row, HOME_HEADERS.heroStats),
  sectionControls: getRowValue(row, HOME_HEADERS.sectionControls),
  campaignEyebrow: getRowValue(row, HOME_HEADERS.campaignEyebrow),
  campaignTitle: getRowValue(row, HOME_HEADERS.campaignTitle),
  campaignDescription: getRowValue(row, HOME_HEADERS.campaignDescription),
  campaignTo: getRowValue(row, HOME_HEADERS.campaignTo),
  campaignCtaLabel: getRowValue(row, HOME_HEADERS.campaignCtaLabel),
  uspItems: getRowValue(row, HOME_HEADERS.uspItems),
  occasions: getRowValue(row, HOME_HEADERS.occasions),
  reviews: getRowValue(row, HOME_HEADERS.reviews),
  newsletterEyebrow: getRowValue(row, HOME_HEADERS.newsletterEyebrow),
  newsletterTitle: getRowValue(row, HOME_HEADERS.newsletterTitle),
  newsletterDescription: getRowValue(row, HOME_HEADERS.newsletterDescription),
  ugcPosts: getRowValue(row, HOME_HEADERS.ugcPosts),
});

const createMetaRows = (locale) => [
  { Field: 'locale', Value: locale },
  { Field: 'import_scope', Value: 'Workbook này áp dụng cho locale đang ghi trong file hoặc locale đang chọn trong admin.' },
];

export const getWorkbookRows = (XLSX, workbook, sheetName) =>
  workbook.SheetNames.includes(sheetName)
    ? XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false })
    : [];

export const getWorkbookRowsByAliases = (XLSX, workbook, sheetNames = []) => {
  for (const name of sheetNames) {
    const rows = getWorkbookRows(XLSX, workbook, name);
    if (rows.length) return rows;
  }

  const firstNonEmptySheet = workbook.SheetNames.find((name) => getWorkbookRows(XLSX, workbook, name).length);
  return firstNonEmptySheet ? getWorkbookRows(XLSX, workbook, firstNonEmptySheet) : [];
};

export const getWorkbookLocale = (XLSX, workbook, fallbackLocale) => {
  const rows = getWorkbookRows(XLSX, workbook, META_SHEET);
  const localeRow = rows.find((row) => row.Field === 'locale');
  return localeRow?.Value?.toString().trim().toLowerCase() || fallbackLocale;
};

export const createCollectionTemplateWorkbook = (XLSX, collections = []) => {
  const workbook = XLSX.utils.book_new();
  appendJsonSheet(
    XLSX,
    workbook,
    COLLECTION_SHEET,
    [
      {
        [COLLECTION_HEADERS.previousSlug]: '',
        [COLLECTION_HEADERS.slug]: 'ao-dai-le-hoi',
        [COLLECTION_HEADERS.title]: 'Áo dài lễ hội',
        [COLLECTION_HEADERS.description]: 'Danh mục dùng cho các mẫu lễ hội, hội xuân và chương trình cần hình ảnh nổi bật.',
        [COLLECTION_HEADERS.image]: 'https://example.com/collections/ao-dai-le-hoi.jpg',
        [COLLECTION_HEADERS.featuredKeywords]: 'lễ hội, tết, hội xuân',
        [COLLECTION_HEADERS.seoHeading]: 'Áo dài lễ hội',
        [COLLECTION_HEADERS.seoBody]: 'Mô tả SEO cho landing collection.',
        [COLLECTION_HEADERS.enTitle]: 'Festival Ao Dai',
        [COLLECTION_HEADERS.enDescription]: 'English description for the collection.',
        [COLLECTION_HEADERS.enSeoHeading]: 'Festival Ao Dai',
        [COLLECTION_HEADERS.enSeoBody]: 'English SEO body for the collection.',
        [COLLECTION_HEADERS.sortPriority]: 1,
        [COLLECTION_HEADERS.isActive]: 'Có',
      },
    ],
    [16, 24, 28, 52, 42, 26, 28, 48, 28, 48, 28, 48, 12, 14]
  );
  appendJsonSheet(XLSX, workbook, 'Danh muc hien tai', buildCollectionExportRows(collections), [16, 24, 28, 52, 42, 26, 28, 48, 28, 48, 28, 48, 12, 14]);
  appendAoaSheet(
    XLSX,
    workbook,
    GUIDE_SHEET,
    [
      ['Hướng dẫn'],
      ['Các cột bắt buộc: Tên danh mục, Slug.'],
      ['Nếu muốn đổi slug của danh mục cũ, giữ giá trị cũ ở cột "Slug cũ" và nhập slug mới ở cột "Slug".'],
      ['Từ khóa nổi bật ngăn cách bằng dấu phẩy.'],
      ['Bản dịch EN là optional nhưng nên điền nếu storefront có locale tiếng Anh.'],
    ],
    [96]
  );
  return workbook;
};

export const buildCollectionExportRows = (collections = []) =>
  collections.map((collection) => {
    const form = toCollectionForm(collection);
    return {
      [COLLECTION_HEADERS.previousSlug]: collection.slug || '',
      [COLLECTION_HEADERS.slug]: form.slug,
      [COLLECTION_HEADERS.title]: form.title,
      [COLLECTION_HEADERS.description]: form.description,
      [COLLECTION_HEADERS.image]: form.image,
      [COLLECTION_HEADERS.featuredKeywords]: form.featuredKeywords,
      [COLLECTION_HEADERS.seoHeading]: form.seoHeading,
      [COLLECTION_HEADERS.seoBody]: form.seoBody,
      [COLLECTION_HEADERS.enTitle]: form.enTitle,
      [COLLECTION_HEADERS.enDescription]: form.enDescription,
      [COLLECTION_HEADERS.enSeoHeading]: form.enSeoHeading,
      [COLLECTION_HEADERS.enSeoBody]: form.enSeoBody,
      [COLLECTION_HEADERS.sortPriority]: form.sortPriority,
      [COLLECTION_HEADERS.isActive]: form.isActive ? 'Có' : 'Không',
    };
  });

export const parseCollectionImportRows = (rows = []) =>
  rows.map((row, index) => {
    const form = {
      ...INITIAL_COLLECTION_FORM,
      slug: getRowValue(row, COLLECTION_HEADERS.slug).trim(),
      title: getRowValue(row, COLLECTION_HEADERS.title).trim(),
      description: getRowValue(row, COLLECTION_HEADERS.description),
      image: getRowValue(row, COLLECTION_HEADERS.image),
      featuredKeywords: getRowValue(row, COLLECTION_HEADERS.featuredKeywords),
      seoHeading: getRowValue(row, COLLECTION_HEADERS.seoHeading),
      seoBody: getRowValue(row, COLLECTION_HEADERS.seoBody),
      enTitle: getRowValue(row, COLLECTION_HEADERS.enTitle),
      enDescription: getRowValue(row, COLLECTION_HEADERS.enDescription),
      enSeoHeading: getRowValue(row, COLLECTION_HEADERS.enSeoHeading),
      enSeoBody: getRowValue(row, COLLECTION_HEADERS.enSeoBody),
      sortPriority: getRowValue(row, COLLECTION_HEADERS.sortPriority),
      isActive: parseBooleanCell(row?.[COLLECTION_HEADERS.isActive], true),
    };

    return {
      ...buildCollectionPayload(form),
      _rowNumbers: [index + 2],
      _previousSlug: getRowValue(row, COLLECTION_HEADERS.previousSlug).trim(),
    };
  });

export const createMarketingWorkbook = (XLSX, { homeForm, marketingAudit, marketingCtas, locale }) => {
  const workbook = XLSX.utils.book_new();
  appendJsonSheet(XLSX, workbook, MARKETING_SHEET, [buildHomeRow(homeForm)], new Array(28).fill(26));
  appendJsonSheet(
    XLSX,
    workbook,
    'Checklist',
    (marketingAudit?.checks || []).map((item) => ({
      'Hạng mục': item.label,
      'Trạng thái': item.ok ? 'OK' : 'Cần bổ sung',
      'Chi tiết': item.detail,
    })),
    [40, 18, 44]
  );
  appendJsonSheet(
    XLSX,
    workbook,
    'CTA',
    (marketingCtas || []).map((item) => ({
      'Khu vực': item.label,
      'Text': item.text,
      Link: item.to,
    })),
    [28, 28, 44]
  );
  appendJsonSheet(XLSX, workbook, META_SHEET, createMetaRows(locale), [22, 88]);
  appendAoaSheet(
    XLSX,
    workbook,
    GUIDE_SHEET,
    [
      ['Hướng dẫn'],
      ['Sheet "Marketing Input" là sheet dùng để import. Chỉ dùng 1 dòng dữ liệu.'],
      ['Các field nhiều dòng như Hero stats, USP items, Reviews... giữ nguyên định dạng từng dòng đang có trong file xuất ra từ admin.'],
      ['Sheet Checklist và CTA chỉ để tham khảo khi review nội dung marketing hiện tại.'],
    ],
    [96]
  );
  return workbook;
};

export const parseMarketingWorkbook = (rows = []) => parseHomeRow(rows[0] || {});

export const createContentWorkbook = (
  XLSX,
  { siteChrome, homePageContent, merchandisingPages, editorialPages, infoPages, locale, contentOptions }
) => {
  const workbook = XLSX.utils.book_new();
  appendJsonSheet(XLSX, workbook, CONTENT_HOME_SHEET, [buildHomeRow(toHomeForm(siteChrome, homePageContent))], new Array(28).fill(26));
  appendJsonSheet(
    XLSX,
    workbook,
    CONTENT_MERCH_SHEET,
    contentOptions.merchandising.map((entry) => {
      const form = toMerchForm(merchandisingPages?.[entry.key]);
      return {
        [MERCH_HEADERS.key]: entry.key,
        [MERCH_HEADERS.label]: entry.label,
        [MERCH_HEADERS.eyebrow]: form.eyebrow,
        [MERCH_HEADERS.title]: form.title,
        [MERCH_HEADERS.description]: form.description,
        [MERCH_HEADERS.image]: form.image,
      };
    }),
    [20, 24, 24, 30, 52, 40]
  );
  appendJsonSheet(
    XLSX,
    workbook,
    CONTENT_EDITORIAL_SHEET,
    contentOptions.editorial.map((entry) => {
      const form = toEditorialForm(editorialPages?.[entry.sectionKey]?.[entry.slug]);
      return {
        [EDITORIAL_HEADERS.sectionKey]: entry.sectionKey,
        [EDITORIAL_HEADERS.slug]: entry.slug,
        [EDITORIAL_HEADERS.label]: entry.label,
        [EDITORIAL_HEADERS.eyebrow]: form.eyebrow,
        [EDITORIAL_HEADERS.title]: form.title,
        [EDITORIAL_HEADERS.description]: form.description,
        [EDITORIAL_HEADERS.image]: form.image,
        [EDITORIAL_HEADERS.bullets]: form.bullets,
        [EDITORIAL_HEADERS.ctaLabel]: form.ctaLabel,
        [EDITORIAL_HEADERS.ctaTo]: form.ctaTo,
      };
    }),
    [18, 24, 28, 20, 30, 54, 40, 36, 24, 32]
  );
  appendJsonSheet(
    XLSX,
    workbook,
    CONTENT_INFO_SHEET,
    contentOptions.info.map((entry) => {
      const form = toInfoForm(infoPages?.[entry.key]);
      return {
        [INFO_HEADERS.key]: entry.key,
        [INFO_HEADERS.label]: entry.label,
        [INFO_HEADERS.eyebrow]: form.eyebrow,
        [INFO_HEADERS.title]: form.title,
        [INFO_HEADERS.intro]: form.intro,
        [INFO_HEADERS.image]: form.image,
        [INFO_HEADERS.sections]: form.sections,
        [INFO_HEADERS.tableHeaders]: form.tableHeaders,
        [INFO_HEADERS.tableRows]: form.tableRows,
        [INFO_HEADERS.faqs]: form.faqs,
        [INFO_HEADERS.cards]: form.cards,
        [INFO_HEADERS.steps]: form.steps,
        [INFO_HEADERS.mapTitle]: form.mapTitle,
        [INFO_HEADERS.mapAddress]: form.mapAddress,
        [INFO_HEADERS.mapCoordinates]: form.mapCoordinates,
        [INFO_HEADERS.mapUrl]: form.mapUrl,
        [INFO_HEADERS.mapEmbedUrl]: form.mapEmbedUrl,
      };
    }),
    [18, 26, 20, 28, 48, 40, 54, 24, 42, 42, 42, 30, 24, 30, 24, 28, 36]
  );
  appendJsonSheet(XLSX, workbook, META_SHEET, createMetaRows(locale), [22, 88]);
  appendAoaSheet(
    XLSX,
    workbook,
    GUIDE_SHEET,
    [
      ['Hướng dẫn'],
      ['Workbook này import toàn bộ phần content cho locale đang ghi trong sheet Meta hoặc locale đang chọn trong admin.'],
      ['Home & Site: chỉ dùng 1 dòng dữ liệu.'],
      ['Merchandising / Editorial / Info Pages: mỗi dòng là một page đã được map sẵn theo key hoặc slug. Không đổi key nếu không thật sự cần.'],
      ['Các field nhiều dòng giữ nguyên định dạng ngắt dòng giống file export để parser đọc đúng.'],
    ],
    [108]
  );
  return workbook;
};

export const parseContentWorkbook = ({
  homeRows = [],
  merchandisingRows = [],
  editorialRows = [],
  infoRows = [],
}) => ({
  homeForm: parseHomeRow(homeRows[0] || {}),
  merchandising: merchandisingRows.map((row) => ({
    key: getRowValue(row, MERCH_HEADERS.key).trim(),
    label: getRowValue(row, MERCH_HEADERS.label).trim(),
    payload: buildMerchPayload({
      ...INITIAL_MERCH_FORM,
      eyebrow: getRowValue(row, MERCH_HEADERS.eyebrow),
      title: getRowValue(row, MERCH_HEADERS.title),
      description: getRowValue(row, MERCH_HEADERS.description),
      image: getRowValue(row, MERCH_HEADERS.image),
    }),
  })),
  editorial: editorialRows.map((row) => ({
    sectionKey: getRowValue(row, EDITORIAL_HEADERS.sectionKey).trim(),
    slug: getRowValue(row, EDITORIAL_HEADERS.slug).trim(),
    label: getRowValue(row, EDITORIAL_HEADERS.label).trim(),
    payload: buildEditorialPayload({
      ...INITIAL_EDITORIAL_FORM,
      eyebrow: getRowValue(row, EDITORIAL_HEADERS.eyebrow),
      title: getRowValue(row, EDITORIAL_HEADERS.title),
      description: getRowValue(row, EDITORIAL_HEADERS.description),
      image: getRowValue(row, EDITORIAL_HEADERS.image),
      bullets: getRowValue(row, EDITORIAL_HEADERS.bullets),
      ctaLabel: getRowValue(row, EDITORIAL_HEADERS.ctaLabel),
      ctaTo: getRowValue(row, EDITORIAL_HEADERS.ctaTo),
    }),
  })),
  info: infoRows.map((row) => ({
    key: getRowValue(row, INFO_HEADERS.key).trim(),
    label: getRowValue(row, INFO_HEADERS.label).trim(),
    payload: buildInfoPayload({
      ...INITIAL_INFO_FORM,
      eyebrow: getRowValue(row, INFO_HEADERS.eyebrow),
      title: getRowValue(row, INFO_HEADERS.title),
      intro: getRowValue(row, INFO_HEADERS.intro),
      image: getRowValue(row, INFO_HEADERS.image),
      sections: getRowValue(row, INFO_HEADERS.sections),
      tableHeaders: getRowValue(row, INFO_HEADERS.tableHeaders),
      tableRows: getRowValue(row, INFO_HEADERS.tableRows),
      faqs: getRowValue(row, INFO_HEADERS.faqs),
      cards: getRowValue(row, INFO_HEADERS.cards),
      steps: getRowValue(row, INFO_HEADERS.steps),
      mapTitle: getRowValue(row, INFO_HEADERS.mapTitle),
      mapAddress: getRowValue(row, INFO_HEADERS.mapAddress),
      mapCoordinates: getRowValue(row, INFO_HEADERS.mapCoordinates),
      mapUrl: getRowValue(row, INFO_HEADERS.mapUrl),
      mapEmbedUrl: getRowValue(row, INFO_HEADERS.mapEmbedUrl),
    }),
  })),
});

export const buildHomePayloadFromMarketingRows = (rows = []) => buildHomePayload(parseMarketingWorkbook(rows));
