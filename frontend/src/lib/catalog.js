import { badgeText } from '../i18n/ui';

export const getProductId = (product) => product?.id || product?._id || '';

const uniqueList = (items = []) => [
  ...new Set(items.map((item) => item?.toString().trim()).filter(Boolean)),
];

export const getProductCollectionSlugs = (product) =>
  uniqueList([
    product?.collectionSlug,
    ...(Array.isArray(product?.collectionSlugs)
      ? product.collectionSlugs
      : product?.collectionSlugs
      ? [product.collectionSlugs]
      : []),
  ]);

const normalizeVariant = (variant, index = 0, product = {}) => ({
  id: variant?.id || `${product.slug || getProductId(product) || 'variant'}-${index + 1}`,
  size: variant?.size || 'One Size',
  color: variant?.color || '',
  sku: variant?.sku || '',
  stock: Math.max(0, Number(variant?.stock || 0)),
  price:
    variant?.price === undefined || variant?.price === null || variant?.price === ''
      ? undefined
      : Number(variant.price),
  isActive: variant?.isActive ?? true,
});

const distributeStock = (totalStock, count, index) => {
  if (count <= 0) return 0;
  const base = Math.floor(totalStock / count);
  const remainder = totalStock % count;
  return base + (index < remainder ? 1 : 0);
};

const buildLegacyVariants = (product) => {
  const sizes = Array.isArray(product?.sizes) && product.sizes.length > 0 ? product.sizes : ['One Size'];
  const colors = Array.isArray(product?.colors) && product.colors.length > 0 ? product.colors : [''];
  const combinations = [];

  sizes.forEach((size) => {
    colors.forEach((color) => {
      combinations.push({ size, color });
    });
  });

  return combinations.map((combination, index) =>
    normalizeVariant(
      {
        id: `${product.slug || getProductId(product) || 'variant'}-${index + 1}`,
        size: combination.size,
        color: combination.color,
        sku: product?.sku ? `${product.sku}-${index + 1}` : '',
        stock: distributeStock(Math.max(0, Number(product?.stock || 0)), combinations.length, index),
      },
      index,
      product
    )
  );
};

export const normalizeProduct = (product) => {
  const normalizedImages = Array.isArray(product?.images) ? product.images : [];
  const collectionSlugs = getProductCollectionSlugs(product);
  const categories = uniqueList([
    product?.category,
    ...(Array.isArray(product?.categories) ? product.categories : product?.categories ? [product.categories] : []),
  ]);
  const normalizedVariants =
    Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants.map((variant, index) => normalizeVariant(variant, index, product))
      : buildLegacyVariants(product);
  const activeVariants = normalizedVariants.filter((variant) => variant.isActive !== false);

  return {
    ...product,
    id: getProductId(product),
    slug: product?.slug || getProductId(product),
    sku: product?.sku || '',
    status: product?.status || 'active',
    price: Number(product?.price || 0),
    compareAtPrice:
      product?.compareAtPrice === undefined || product?.compareAtPrice === null || product?.compareAtPrice === ''
        ? undefined
        : Number(product.compareAtPrice),
    stock: activeVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0),
    trendingScore: Number(product?.trendingScore || 0),
    category: product?.category || categories[0] || '',
    categories,
    collectionSlug: collectionSlugs[0] || '',
    collectionSlugs,
    coverImage: product?.coverImage || normalizedImages[0] || '',
    images: normalizedImages,
    variants: normalizedVariants,
    sizes: [...new Set(activeVariants.map((variant) => variant.size).filter(Boolean))],
    colors: [...new Set(activeVariants.map((variant) => variant.color).filter(Boolean))],
    styleTags: Array.isArray(product?.styleTags) ? product.styleTags : [],
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    isNew: Boolean(product?.isNew),
    isBestSeller: Boolean(product?.isBestSeller),
    isOnSale: Boolean(product?.isOnSale),
  };
};

export const normalizeProducts = (products = []) =>
  products.map(normalizeProduct).filter((product) => product.id);

export const titleize = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const matchesCollection = (product, collection) => {
  if (!collection) return true;
  const collectionSlugs = getProductCollectionSlugs(product);
  if (collectionSlugs.length && collection?.slug) {
    return collectionSlugs.includes(collection.slug);
  }

  const source = [product.category, product.name, product.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return collection.featuredKeywords.some((keyword) => source.includes(keyword.toLowerCase()));
};

export const getProductBadges = (product, locale = 'vi') => {
  const badges = [];
  const labels = badgeText[locale] || badgeText.vi;

  if (product?.isNew) badges.push(labels.new);
  if (product?.isOnSale) badges.push(labels.sale);
  if (product?.isBestSeller) badges.push(labels.bestseller);
  if (Number(product?.stock || 0) > 0 && Number(product?.stock || 0) <= 8) badges.push(labels.lowStock);

  return badges;
};

export const isPublicProduct = (product) => product?.status !== 'draft';

export const getActiveVariants = (product) =>
  (product?.variants || []).filter((variant) => variant?.isActive !== false);

export const getAvailableVariants = (product) =>
  getActiveVariants(product).filter((variant) => Number(variant.stock || 0) > 0);

export const getVariantSizes = (product) =>
  [...new Set(getActiveVariants(product).map((variant) => variant.size).filter(Boolean))];

export const getVariantColors = (product, size) =>
  [
    ...new Set(
      getActiveVariants(product)
        .filter((variant) => !size || variant.size === size)
        .map((variant) => variant.color)
        .filter(Boolean)
    ),
  ];

export const getAvailableSizes = (product) =>
  [...new Set(getAvailableVariants(product).map((variant) => variant.size).filter(Boolean))];

export const getAvailableColors = (product, size) =>
  [
    ...new Set(
      getAvailableVariants(product)
        .filter((variant) => !size || variant.size === size)
        .map((variant) => variant.color)
        .filter(Boolean)
    ),
  ];

export const findVariant = (product, { size, color } = {}) =>
  getActiveVariants(product).find(
    (variant) =>
      (!size || variant.size === size) &&
      (!color || variant.color === color)
  ) || null;

export const findFirstAvailableVariant = (product) => getAvailableVariants(product)[0] || findVariant(product);

export const isVariantAvailable = (product, { size, color } = {}) =>
  Number(findVariant(product, { size, color })?.stock || 0) > 0;
