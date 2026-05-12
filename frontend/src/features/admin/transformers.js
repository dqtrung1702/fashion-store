import { getProductCollectionSlugs } from '../../lib/catalog';
import {
  formatList,
  formatStructuredLines,
  normalizeComparableText,
  parseLineItems,
  parseList,
  parseLooseList,
  parseStructuredLines,
  slugify,
  uniqueList,
} from '../../lib/text';
import { HOME_SECTION_CONTROL_OPTIONS } from './constants';

const getImportCell = (row, aliases = []) => {
  const wanted = new Set(aliases.map(normalizeComparableText));
  const foundKey = Object.keys(row).find((key) => wanted.has(normalizeComparableText(key)));
  return foundKey ? row[foundKey] : '';
};

const toBooleanImport = (value, fallback = false) => {
  if (value === true || value === false) return value;
  const normalized = value.toString().trim().toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'yes', 'true', 'on', 'co', 'có', 'x', 'moi', 'mới', 'ban chay', 'bán chạy'].includes(normalized);
};

const normalizeImportedStatus = (value) => {
  const normalized = value.toString().trim().toLowerCase();
  return ['draft', 'nhap', 'nháp', 'an', 'ẩn', 'hide'].includes(normalized) ? 'draft' : 'active';
};

const toNumberImport = (value, fallback = 0) => {
  const normalized = value.toString().replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveImportCollectionSlugs = (value, collections = []) => {
  const collectionLookup = new Map();
  collections.forEach((collection) => {
    collectionLookup.set(normalizeComparableText(collection.slug), collection.slug);
    collectionLookup.set(normalizeComparableText(collection.title), collection.slug);
  });

  return [
    ...new Set(
      parseLooseList(value)
        .map((entry) => collectionLookup.get(normalizeComparableText(entry)) || slugify(entry))
        .filter(Boolean)
    ),
  ];
};

const buildImportedVariants = ({ variants, size, color, sku, stock }) => {
  if (variants.toString().trim()) {
    return variants.toString().replace(/;/g, '\n');
  }

  const normalizedStock = toNumberImport(stock);
  return `${size || 'One Size'} | ${color || ''} | ${sku ? `${sku}-1` : ''} | ${normalizedStock}`;
};

const formatExportedVariants = (variants = []) =>
  variants
    .map((variant) =>
      [variant?.size || 'One Size', variant?.color || '', variant?.sku || '', Number(variant?.stock || 0)].join(' | ')
    )
    .join('\n');

const parseEnabledFlag = (value = 'on') => {
  const normalized = value.trim().toLowerCase();
  return !['off', 'false', '0', 'no', 'hide', 'hidden', 'an', 'ẩn', 'tat', 'tắt'].includes(normalized);
};

const buildProductPayloadFromImportRow = (row, collections = []) => {
  const name = getImportCell(row, ['name', 'ten san pham', 'tên sản phẩm', 'product name']);
  const rawSlug = getImportCell(row, ['slug', 'ma slug', 'url slug']);
  const sku = getImportCell(row, ['sku', 'ma sku', 'mã sku', 'ma san pham', 'mã sản phẩm']);
  const description =
    getImportCell(row, ['description', 'mo ta', 'mô tả', 'description vi']) || 'Thông tin sản phẩm sẽ được bổ sung sau.';
  const collectionValue = getImportCell(row, [
    'collectionSlugs',
    'collection slugs',
    'collectionSlug',
    'collection slug',
    'danh muc',
    'danh mục',
    'categories',
    'category',
  ]);
  const collectionSlugs = resolveImportCollectionSlugs(collectionValue, collections);
  const importedSku = sku.toString().trim() || slugify(rawSlug || name).toUpperCase();

  return {
    slug: slugify(rawSlug || name || importedSku),
    sku: importedSku,
    status: normalizeImportedStatus(getImportCell(row, ['status', 'trang thai', 'trạng thái'])),
    name: name.toString().trim(),
    description: description.toString().trim(),
    collectionSlug: collectionSlugs[0] || '',
    collectionSlugs,
    price: toNumberImport(getImportCell(row, ['price', 'gia', 'giá', 'gia ban', 'giá bán'])),
    compareAtPrice:
      getImportCell(row, ['compareAtPrice', 'compare at price', 'gia gach', 'giá gạch', 'gia niem yet']) === ''
        ? ''
        : toNumberImport(getImportCell(row, ['compareAtPrice', 'compare at price', 'gia gach', 'giá gạch', 'gia niem yet'])),
    coverImage: getImportCell(row, ['coverImage', 'cover image', 'anh cover', 'ảnh cover']).toString().trim(),
    images: parseLooseList(getImportCell(row, ['images', 'gallery', 'anh', 'ảnh'])),
    variants: buildImportedVariants({
      variants: getImportCell(row, ['variants', 'bien the', 'biến thể']),
      size: getImportCell(row, ['size', 'kich co', 'kích cỡ']),
      color: getImportCell(row, ['color', 'mau', 'màu']),
      sku: importedSku,
      stock: getImportCell(row, ['stock', 'ton kho', 'tồn kho', 'so luong', 'số lượng']),
    }),
    styleTags: parseLooseList(getImportCell(row, ['styleTags', 'style tags', 'tags', 'tag', 'phong cach', 'phong cách'])),
    material: getImportCell(row, ['material', 'chat lieu', 'chất liệu']).toString().trim(),
    fitNotes: getImportCell(row, ['fitNotes', 'fit notes', 'ghi chu fit', 'ghi chú fit']).toString().trim(),
    seoTitle: getImportCell(row, ['seoTitle', 'seo title']).toString().trim(),
    seoDescription: getImportCell(row, ['seoDescription', 'seo description']).toString().trim(),
    isNew: toBooleanImport(getImportCell(row, ['isNew', 'new', 'moi', 'mới']), true),
    isBestSeller: toBooleanImport(getImportCell(row, ['isBestSeller', 'best seller', 'ban chay', 'bán chạy'])),
    isOnSale: toBooleanImport(getImportCell(row, ['isOnSale', 'sale', 'giam gia', 'giảm giá'])),
    trendingScore: toNumberImport(getImportCell(row, ['trendingScore', 'trending score', 'diem trending'])),
    translations: {
      en: {
        name: getImportCell(row, ['enName', 'english name', 'name en']).toString().trim(),
        description: getImportCell(row, ['enDescription', 'english description', 'description en']).toString().trim(),
        material: getImportCell(row, ['enMaterial', 'english material', 'material en']).toString().trim(),
        fitNotes: getImportCell(row, ['enFitNotes', 'english fit notes', 'fit notes en']).toString().trim(),
        seoTitle: getImportCell(row, ['enSeoTitle', 'english seo title', 'seo title en']).toString().trim(),
        seoDescription: getImportCell(row, ['enSeoDescription', 'english seo description', 'seo description en']).toString().trim(),
      },
    },
  };
};

const mergeImportedProductPayload = (current, incoming) => ({
  ...current,
  collectionSlugs: uniqueList([...current.collectionSlugs, ...incoming.collectionSlugs]),
  collectionSlug: current.collectionSlug || incoming.collectionSlug,
  images: uniqueList([...current.images, ...incoming.images]),
  variants: uniqueList([current.variants, incoming.variants].join('\n').split('\n')).join('\n'),
  styleTags: uniqueList([...current.styleTags, ...incoming.styleTags]),
  isNew: current.isNew || incoming.isNew,
  isBestSeller: current.isBestSeller || incoming.isBestSeller,
  isOnSale: current.isOnSale || incoming.isOnSale,
  trendingScore: Math.max(Number(current.trendingScore || 0), Number(incoming.trendingScore || 0)),
  _rowNumbers: [...(current._rowNumbers || []), ...(incoming._rowNumbers || [])],
});

export const buildProductImportTemplateRows = (collections = []) => {
  const firstCollection = collections[0]?.slug || 'le-hoi-tet';
  const secondCollection = collections[1]?.slug || firstCollection;
  const thirdCollection = collections[2]?.slug || firstCollection;

  return [
    {
      'Tên sản phẩm': 'Áo dài mẫu lễ hội',
      Slug: 'ao-dai-mau-le-hoi',
      SKU: 'AD-MAU-001',
      'Trạng thái': 'active',
      'Danh mục': [firstCollection, secondCollection].filter(Boolean).join(', '),
      'Giá bán': 1290000,
      'Giá gạch': 1590000,
      'Mô tả': 'Mô tả sản phẩm tối thiểu 10 ký tự. Có thể chỉnh lại sau khi import.',
      'Tồn kho': 12,
      'Kích cỡ': 'M',
      'Màu': 'Đỏ',
      'Biến thể': 'S | Đỏ | AD-MAU-001-S | 4\nM | Đỏ | AD-MAU-001-M | 5\nL | Đỏ | AD-MAU-001-L | 3',
      'Chất liệu': 'Lụa',
      'Ghi chú fit': 'Form vừa, nên chọn đúng size thường mặc.',
      'Phong cách': 'lễ hội, tết',
      'Ảnh cover': '',
      'Ảnh': '',
      'Mới': 'yes',
      'Bán chạy': '',
      'Giảm giá': 'yes',
      'Điểm trending': 80,
      'SEO title': '',
      'SEO description': '',
      'English name': '',
      'English description': '',
    },
    {
      'Tên sản phẩm': 'Áo dài mẫu đồng phục',
      Slug: 'ao-dai-mau-dong-phuc',
      SKU: 'AD-MAU-002',
      'Trạng thái': 'active',
      'Danh mục': secondCollection,
      'Giá bán': 990000,
      'Giá gạch': '',
      'Mô tả': 'Mẫu sản phẩm thứ hai để admin điền tiếp nhiều sản phẩm trong cùng một file.',
      'Tồn kho': 20,
      'Kích cỡ': 'S',
      'Màu': 'Xanh',
      'Biến thể': '',
      'Chất liệu': 'Gấm',
      'Ghi chú fit': '',
      'Phong cách': 'đồng phục, tập thể',
      'Ảnh cover': '',
      'Ảnh': '',
      'Mới': 'yes',
      'Bán chạy': 'yes',
      'Giảm giá': '',
      'Điểm trending': 65,
      'SEO title': '',
      'SEO description': '',
      'English name': '',
      'English description': '',
    },
    {
      'Tên sản phẩm': 'Áo dài mẫu sự kiện',
      Slug: 'ao-dai-mau-su-kien',
      SKU: 'AD-MAU-003',
      'Trạng thái': 'active',
      'Danh mục': thirdCollection,
      'Giá bán': 1190000,
      'Giá gạch': '',
      'Mô tả': 'Mỗi dòng là một sản phẩm. Có thể thêm bao nhiêu dòng sản phẩm tùy cần.',
      'Tồn kho': 8,
      'Kích cỡ': 'M',
      'Màu': 'Trắng',
      'Biến thể': '',
      'Chất liệu': 'Voan',
      'Ghi chú fit': '',
      'Phong cách': 'sự kiện',
      'Ảnh cover': '',
      'Ảnh': '',
      'Mới': '',
      'Bán chạy': '',
      'Giảm giá': '',
      'Điểm trending': 50,
      'SEO title': '',
      'SEO description': '',
      'English name': '',
      'English description': '',
    },
  ];
};

export const buildProductExportRows = (products = []) =>
  products.map((product) => ({
    'Tên sản phẩm': product.name || '',
    Slug: product.slug || '',
    SKU: product.sku || '',
    'Trạng thái': product.status || 'active',
    'Danh mục': getProductCollectionSlugs(product).join(', '),
    'Giá bán': Number(product.price || 0),
    'Giá gạch': product.compareAtPrice ?? '',
    'Mô tả': product.description || '',
    'Tồn kho': Number(product.stock || 0),
    'Kích cỡ': (product.sizes || []).join(', '),
    'Màu': (product.colors || []).join(', '),
    'Biến thể': formatExportedVariants(product.variants || []),
    'Chất liệu': product.material || '',
    'Ghi chú fit': product.fitNotes || '',
    'Phong cách': (product.styleTags || []).join(', '),
    'Mới': product.isNew ? 'yes' : '',
    'Bán chạy': product.isBestSeller ? 'yes' : '',
    'Giảm giá': product.isOnSale ? 'yes' : '',
    'Điểm trending': Number(product.trendingScore || 0),
    'SEO title': product.seoTitle || '',
    'SEO description': product.seoDescription || '',
    'English name': product.translations?.en?.name || '',
    'English description': product.translations?.en?.description || '',
    'English material': product.translations?.en?.material || '',
    'English fit notes': product.translations?.en?.fitNotes || '',
    'English SEO title': product.translations?.en?.seoTitle || '',
    'English SEO description': product.translations?.en?.seoDescription || '',
  }));

export const buildSectionControlEntries = (sectionControls = {}) =>
  HOME_SECTION_CONTROL_OPTIONS.map((entry) => ({
    ...entry,
    eyebrow: sectionControls[entry.key]?.eyebrow ?? '',
    title: sectionControls[entry.key]?.title ?? '',
    ctaLabel: sectionControls[entry.key]?.ctaLabel ?? '',
    ctaTo: sectionControls[entry.key]?.ctaTo ?? '',
    enabled: sectionControls[entry.key]?.enabled !== false,
  }));

export const parseVariantRows = (value) =>
  parseStructuredLines(value, 4, ([size = '', color = '', sku = '', stock = '0'], index) => ({
    id: `${sku || 'variant'}-${index + 1}`,
    size: size || 'One Size',
    color: color || '-',
    sku: sku || '-',
    stock: Number(stock || 0),
  }));

export const toProductForm = (product) => ({
  slug: product?.slug ?? product?.id ?? '',
  sku: product?.sku ?? '',
  status: product?.status ?? 'active',
  name: product?.name ?? '',
  description: product?.description ?? '',
  collectionSlug: product?.collectionSlug ?? '',
  collectionSlugs: product?.collectionSlugs?.length ? product.collectionSlugs : product?.collectionSlug ? [product.collectionSlug] : [],
  price: product?.price?.toString() ?? '',
  compareAtPrice: product?.compareAtPrice?.toString() ?? '',
  coverImage: product?.coverImage ?? '',
  variants: formatStructuredLines(product?.variants ?? [], (variant) => [variant.size, variant.color, variant.sku, variant.stock].join(' | ')),
  images: (product?.images ?? []).join('\n'),
  styleTags: formatList(product?.styleTags ?? []),
  material: product?.material ?? '',
  fitNotes: product?.fitNotes ?? '',
  seoTitle: product?.seoTitle ?? '',
  seoDescription: product?.seoDescription ?? '',
  enName: product?.translations?.en?.name ?? '',
  enDescription: product?.translations?.en?.description ?? '',
  enMaterial: product?.translations?.en?.material ?? '',
  enFitNotes: product?.translations?.en?.fitNotes ?? '',
  enSeoTitle: product?.translations?.en?.seoTitle ?? '',
  enSeoDescription: product?.translations?.en?.seoDescription ?? '',
  isNew: Boolean(product?.isNew),
  isBestSeller: Boolean(product?.isBestSeller),
  isOnSale: Boolean(product?.isOnSale),
  trendingScore: product?.trendingScore?.toString() ?? '',
});

export const toCollectionForm = (collection) => ({
  slug: collection?.slug ?? '',
  title: collection?.title ?? '',
  description: collection?.description ?? '',
  image: collection?.image ?? '',
  featuredKeywords: formatList(collection?.featuredKeywords ?? []),
  seoHeading: collection?.seoHeading ?? '',
  seoBody: collection?.seoBody ?? '',
  enTitle: collection?.translations?.en?.title ?? '',
  enDescription: collection?.translations?.en?.description ?? '',
  enSeoHeading: collection?.translations?.en?.seoHeading ?? '',
  enSeoBody: collection?.translations?.en?.seoBody ?? '',
  sortPriority: collection?.sortPriority?.toString() ?? '',
  isActive: collection?.isActive ?? true,
});

export const toHomeForm = (siteChrome, homePageContent) => ({
  brandName: siteChrome?.brandName ?? '',
  announcement: siteChrome?.announcement ?? '',
  footerHeading: siteChrome?.footerHeading ?? '',
  footerDescription: siteChrome?.footerDescription ?? '',
  storeHoldDurationLabel: siteChrome?.storeHoldDurationLabel ?? '24h',
  backgroundImage: siteChrome?.backgroundImage ?? '',
  heroImage: homePageContent?.hero?.image ?? '',
  heroEyebrow: homePageContent?.hero?.eyebrow ?? '',
  heroTitle: homePageContent?.hero?.title ?? '',
  heroDescription: homePageContent?.hero?.description ?? '',
  heroPrimaryCtaLabel: homePageContent?.hero?.primaryCtaLabel ?? '',
  heroPrimaryCtaTo: homePageContent?.hero?.primaryCtaTo ?? '',
  heroSecondaryCtaLabel: homePageContent?.hero?.secondaryCtaLabel ?? '',
  heroSecondaryCtaTo: homePageContent?.hero?.secondaryCtaTo ?? '',
  heroStats: formatStructuredLines(homePageContent?.heroStats ?? [], (item) => [item.label, item.value, item.detail].join(' | ')),
  sectionControls: formatStructuredLines(
    buildSectionControlEntries(homePageContent?.sectionControls),
    (item) => [item.key, item.eyebrow, item.title, item.ctaLabel, item.ctaTo, item.enabled ? 'on' : 'off'].join(' | ')
  ),
  campaignEyebrow: homePageContent?.campaignBanner?.eyebrow ?? '',
  campaignTitle: homePageContent?.campaignBanner?.title ?? '',
  campaignDescription: homePageContent?.campaignBanner?.description ?? '',
  campaignTo: homePageContent?.campaignBanner?.to ?? '',
  campaignCtaLabel: homePageContent?.campaignBanner?.ctaLabel ?? '',
  uspItems: formatStructuredLines(homePageContent?.uspItems ?? [], (item) => [item.title, item.detail].join(' | ')),
  occasions: formatStructuredLines(homePageContent?.occasions ?? [], (item) => [item.title, item.description, item.to, item.image].join(' | ')),
  reviews: formatStructuredLines(homePageContent?.reviews ?? [], (item) => [item.quote, item.name, item.meta, item.rating].join(' | ')),
  newsletterEyebrow: homePageContent?.newsletter?.eyebrow ?? '',
  newsletterTitle: homePageContent?.newsletter?.title ?? '',
  newsletterDescription: homePageContent?.newsletter?.description ?? '',
  ugcPosts: formatStructuredLines(homePageContent?.ugcPosts ?? [], (item) => [item.platform, item.handle, item.caption, item.image].join(' | ')),
});

export const toMerchForm = (page) => ({
  eyebrow: page?.eyebrow ?? '',
  title: page?.title ?? '',
  description: page?.description ?? '',
  image: page?.image ?? '',
});

export const toEditorialForm = (page) => ({
  eyebrow: page?.eyebrow ?? '',
  title: page?.title ?? '',
  description: page?.description ?? '',
  image: page?.image ?? '',
  bullets: formatStructuredLines(page?.bullets ?? [], (bullet) => bullet),
  ctaLabel: page?.cta?.label ?? '',
  ctaTo: page?.cta?.to ?? '',
});

export const toInfoForm = (page) => ({
  eyebrow: page?.eyebrow ?? '',
  title: page?.title ?? '',
  intro: page?.intro ?? '',
  image: page?.image ?? '',
  sections: formatStructuredLines(page?.sections ?? [], (item) => [item.title, item.body].join(' | ')),
  tableHeaders: (page?.table?.headers ?? []).join(', '),
  tableRows: formatStructuredLines(page?.table?.rows ?? [], (row) => row.join(' | ')),
  faqs: formatStructuredLines(page?.faqs ?? [], (item) => [item.question, item.answer].join(' | ')),
  cards: formatStructuredLines(page?.cards ?? [], (item) => [item.title, item.detail, item.note].join(' | ')),
  steps: formatStructuredLines(page?.steps ?? [], (item) => item),
  mapTitle: page?.storeLocation?.title ?? '',
  mapAddress: page?.storeLocation?.address ?? '',
  mapCoordinates: page?.storeLocation?.coordinates ?? '',
  mapUrl: page?.storeLocation?.mapUrl ?? '',
  mapEmbedUrl: page?.storeLocation?.embedUrl ?? '',
});

export const buildProductPayload = (formData) => ({
  slug: formData.slug.trim(),
  sku: formData.sku.trim(),
  status: formData.status,
  name: formData.name.trim(),
  description: formData.description.trim(),
  collectionSlug: (formData.collectionSlugs?.[0] || formData.collectionSlug || '').trim(),
  collectionSlugs: formData.collectionSlugs || [],
  price: Number(formData.price || 0),
  compareAtPrice: formData.compareAtPrice === '' ? '' : Number(formData.compareAtPrice),
  coverImage: formData.coverImage.trim(),
  variants: formData.variants,
  images: parseList(formData.images),
  styleTags: parseList(formData.styleTags),
  material: formData.material.trim(),
  fitNotes: formData.fitNotes.trim(),
  seoTitle: formData.seoTitle.trim(),
  seoDescription: formData.seoDescription.trim(),
  isNew: formData.isNew,
  isBestSeller: formData.isBestSeller,
  isOnSale: formData.isOnSale,
  trendingScore: Number(formData.trendingScore || 0),
  translations: {
    en: {
      name: formData.enName.trim(),
      description: formData.enDescription.trim(),
      material: formData.enMaterial.trim(),
      fitNotes: formData.enFitNotes.trim(),
      seoTitle: formData.enSeoTitle.trim(),
      seoDescription: formData.enSeoDescription.trim(),
    },
  },
});

export const buildProductPayloadsFromImportRows = (rows = [], collections = []) => {
  const productsBySlug = new Map();

  rows.forEach((row, index) => {
    const payload = buildProductPayloadFromImportRow(row, collections);
    payload._rowNumbers = [index + 2];
    if (!payload.slug) return;

    const current = productsBySlug.get(payload.slug);
    productsBySlug.set(payload.slug, current ? mergeImportedProductPayload(current, payload) : payload);
  });

  return [...productsBySlug.values()];
};

export const buildCollectionPayload = (formData) => ({
  slug: formData.slug.trim(),
  title: formData.title.trim(),
  description: formData.description.trim(),
  image: formData.image.trim(),
  featuredKeywords: parseList(formData.featuredKeywords),
  seoHeading: formData.seoHeading.trim(),
  seoBody: formData.seoBody.trim(),
  sortPriority: formData.sortPriority === '' ? '' : Number(formData.sortPriority),
  isActive: formData.isActive,
  translations: {
    en: {
      title: formData.enTitle.trim(),
      description: formData.enDescription.trim(),
      seoHeading: formData.enSeoHeading.trim(),
      seoBody: formData.enSeoBody.trim(),
    },
  },
});

export const buildHomePayload = (formData) => ({
  siteChrome: {
    brandName: formData.brandName.trim(),
    announcement: formData.announcement.trim(),
    footerHeading: formData.footerHeading.trim(),
    footerDescription: formData.footerDescription.trim(),
    storeHoldDurationLabel: formData.storeHoldDurationLabel.trim() || '24h',
    backgroundImage: formData.backgroundImage.trim(),
  },
  homePageContent: {
    hero: {
      image: formData.heroImage.trim(),
      eyebrow: formData.heroEyebrow.trim(),
      title: formData.heroTitle.trim(),
      description: formData.heroDescription.trim(),
      primaryCtaLabel: formData.heroPrimaryCtaLabel.trim(),
      primaryCtaTo: formData.heroPrimaryCtaTo.trim(),
      secondaryCtaLabel: formData.heroSecondaryCtaLabel.trim(),
      secondaryCtaTo: formData.heroSecondaryCtaTo.trim(),
    },
    heroStats: parseStructuredLines(formData.heroStats, 3, ([label, value, detail]) => ({ label, value, detail })),
    sectionControls: parseStructuredLines(formData.sectionControls, 6, ([key, eyebrow, title, ctaLabel, ctaTo, enabled]) => {
      const sectionKey = key.trim();
      if (!sectionKey) return null;
      return {
        key: sectionKey,
        value: {
          eyebrow,
          title,
          ctaLabel,
          ctaTo,
          enabled: parseEnabledFlag(enabled),
        },
      };
    }).reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: item.value,
      }),
      {}
    ),
    campaignBanner: {
      eyebrow: formData.campaignEyebrow.trim(),
      title: formData.campaignTitle.trim(),
      description: formData.campaignDescription.trim(),
      to: formData.campaignTo.trim(),
      ctaLabel: formData.campaignCtaLabel.trim(),
    },
    uspItems: parseStructuredLines(formData.uspItems, 2, ([title, detail]) => ({ title, detail })),
    occasions: parseStructuredLines(formData.occasions, 4, ([title, description, to, image]) => ({
      title,
      description,
      to,
      image,
    })),
    reviews: parseStructuredLines(formData.reviews, 4, ([quote, name, meta, rating]) => ({
      quote,
      name,
      meta,
      rating: Number(rating || 5),
    })),
    newsletter: {
      eyebrow: formData.newsletterEyebrow.trim(),
      title: formData.newsletterTitle.trim(),
      description: formData.newsletterDescription.trim(),
    },
    ugcPosts: parseStructuredLines(formData.ugcPosts, 4, ([platform, handle, caption, image]) => ({
      platform,
      handle,
      caption,
      image,
    })),
  },
});

export const buildMerchPayload = (formData) => ({
  eyebrow: formData.eyebrow.trim(),
  title: formData.title.trim(),
  description: formData.description.trim(),
  image: formData.image.trim(),
});

export const buildEditorialPayload = (formData) => ({
  eyebrow: formData.eyebrow.trim(),
  title: formData.title.trim(),
  description: formData.description.trim(),
  image: formData.image.trim(),
  bullets: parseLineItems(formData.bullets),
  cta: {
    label: formData.ctaLabel.trim(),
    to: formData.ctaTo.trim(),
  },
});

export const buildInfoPayload = (formData) => {
  const tableHeaders = parseList(formData.tableHeaders);
  const tableRows = parseStructuredLines(
    formData.tableRows,
    Math.max(tableHeaders.length, 1),
    (row) => row.filter((cell, index) => index < tableHeaders.length || tableHeaders.length === 0)
  );

  const storeLocation = [
    formData.mapTitle,
    formData.mapAddress,
    formData.mapCoordinates,
    formData.mapUrl,
    formData.mapEmbedUrl,
  ].some((value) => value?.trim())
    ? {
        title: formData.mapTitle.trim(),
        address: formData.mapAddress.trim(),
        coordinates: formData.mapCoordinates.trim(),
        mapUrl: formData.mapUrl.trim(),
        embedUrl: formData.mapEmbedUrl.trim(),
      }
    : undefined;

  return {
    eyebrow: formData.eyebrow.trim(),
    title: formData.title.trim(),
    intro: formData.intro.trim(),
    image: formData.image.trim(),
    sections: parseStructuredLines(formData.sections, 2, ([title, body]) => ({ title, body })) || undefined,
    table: tableHeaders.length
      ? {
          headers: tableHeaders,
          rows: tableRows,
        }
      : undefined,
    faqs: parseStructuredLines(formData.faqs, 2, ([question, answer]) => ({ question, answer })) || undefined,
    cards: parseStructuredLines(formData.cards, 3, ([title, detail, note]) => ({ title, detail, note })) || undefined,
    steps: parseLineItems(formData.steps) || undefined,
    storeLocation,
  };
};
