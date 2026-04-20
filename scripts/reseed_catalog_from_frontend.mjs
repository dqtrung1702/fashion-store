import { mockProducts } from '../frontend/src/data/mockCatalog.js';
import { collectionDefinitions } from '../frontend/src/data/publicContent.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const cleanList = (items = []) => [...new Set((items || []).map((item) => String(item || '').trim()).filter(Boolean))];

const buildBaseCollections = () =>
  Object.entries(collectionDefinitions).map(([slug, definition], index) => ({
    slug,
    title: definition.title,
    description: definition.description || '',
    featuredKeywords: cleanList(definition.featuredKeywords || []),
    seoHeading: definition.seoHeading || '',
    seoBody: definition.seoBody || '',
    sortPriority: index + 1,
    isActive: definition.isActive ?? true,
  }));

const buildCollections = () => {
  const baseCollections = buildBaseCollections();
  const knownSlugs = new Set(baseCollections.map((collection) => collection.slug));
  const extraCollections = [];

  for (const product of mockProducts) {
    const inferred = inferCollectionSlug(product, baseCollections);
    if (knownSlugs.has(inferred)) continue;

    knownSlugs.add(inferred);
    extraCollections.push({
      slug: inferred,
      title: product.category || inferred,
      description: `Nhóm sản phẩm được tạo tự động từ dữ liệu seed cho ${product.category || inferred}.`,
      featuredKeywords: cleanList([product.category || inferred, ...(product.styleTags || [])]),
      seoHeading: product.category || inferred,
      seoBody: `Collection được tạo tự động để tương thích dữ liệu test khi reseed catalog.`,
      sortPriority: baseCollections.length + extraCollections.length + 1,
      isActive: true,
    });
  }

  return [...baseCollections, ...extraCollections];
};

const inferCollectionSlug = (product, collections) => {
  const source = [
    product?.category,
    product?.name,
    product?.description,
    ...(product?.styleTags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const directMatch = collections.find(
    (collection) => collection.title.toLowerCase() === String(product?.category || '').toLowerCase()
  );
  if (directMatch) return directMatch.slug;

  const keywordMatch = collections.find((collection) =>
    (collection.featuredKeywords || []).some((keyword) => source.includes(keyword.toLowerCase()))
  );
  return keywordMatch?.slug || slugify(product?.category || 'misc');
};

const distributeStock = (totalStock, count, index) => {
  if (count <= 0) return 0;
  const base = Math.floor(totalStock / count);
  const remainder = totalStock % count;
  return base + (index < remainder ? 1 : 0);
};

const buildVariants = (product) => {
  const sizes = cleanList(product?.sizes?.length ? product.sizes : ['One Size']);
  const colors = cleanList(product?.colors?.length ? product.colors : ['']);
  const combinations = [];

  sizes.forEach((size) => {
    colors.forEach((color) => {
      combinations.push({ size, color });
    });
  });

  const baseSku = slugify(product?.id || product?.name || 'product').toUpperCase();

  return combinations.map((combination, index) => ({
    id: `${slugify(product?.id || product?.name)}-${index + 1}`,
    size: combination.size || 'One Size',
    color: combination.color || '',
    sku: `${baseSku}-${index + 1}`,
    stock: distributeStock(Number(product?.stock || 0), combinations.length, index),
    isActive: true,
  }));
};

const buildProducts = (collections) =>
  mockProducts.map((product) => {
    const collectionSlug = inferCollectionSlug(product, collections);
    const slug = slugify(product?.id || product?.name);
    return {
      slug,
      sku: slug.toUpperCase(),
      status: 'active',
      name: product.name,
      description: product.description,
      collectionSlug,
      price: Number(product.price || 0),
      compareAtPrice:
        product.compareAtPrice === undefined || product.compareAtPrice === null
          ? null
          : Number(product.compareAtPrice),
      coverImage: product.images?.[0] || '',
      images: cleanList(product.images || []),
      variants: buildVariants(product),
      styleTags: cleanList(product.styleTags || []),
      material: product.material || '',
      fitNotes: product.fitNotes || '',
      seoTitle: `${product.name} | Áo Dài Rạng Rỡ`,
      seoDescription: product.description || '',
      isNew: Boolean(product.isNew),
      isBestSeller: Boolean(product.isBestSeller),
      isOnSale: Boolean(product.isOnSale),
      trendingScore: Number(product.trendingScore || 0),
    };
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

const importCatalog = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalog/import`, {
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
  const collections = buildCollections();
  const products = buildProducts(collections);
  const payload = { collections, products };

  if (process.argv.includes('--print')) {
    process.stdout.write(JSON.stringify(payload, null, 2));
    return;
  }

  const auth = await login();
  const result = await importCatalog(auth.access_token, payload);

  console.log(
    JSON.stringify(
      {
        collections: collections.length,
        products: products.length,
        importResult: result,
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
