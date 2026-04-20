import { create } from 'zustand';
import { mockProducts } from '../data/mockCatalog';
import { collectionDefinitions } from '../data/publicContent';
import { getProductCollectionSlugs, isPublicProduct, normalizeProducts } from '../lib/catalog';
import { adminService, productsService } from '../services';

const PRODUCTS_STORAGE_KEY = 'catalog-products';
const COLLECTIONS_STORAGE_KEY = 'catalog-collections';
const CATALOG_SEED_VERSION_KEY = 'catalog-seed-version';
const CATALOG_SEED_VERSION = 'ao-dai-bulk-v1';

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const clone = (value) => JSON.parse(JSON.stringify(value));

const readStorage = (key, fallbackValue) => {
  if (typeof window === 'undefined') return fallbackValue;
  if (window.localStorage.getItem(CATALOG_SEED_VERSION_KEY) !== CATALOG_SEED_VERSION) {
    return fallbackValue;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallbackValue;

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(key);
    return fallbackValue;
  }
};

const persistStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  return value
    .toString()
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueList = (items = []) => [...new Set(items.map((item) => item?.toString().trim()).filter(Boolean))];

const getCollectionsBySlug = (collections = [], slugs = []) =>
  uniqueList(slugs)
    .map((slug) => collections.find((collection) => collection.slug === slug))
    .filter(Boolean);

const getCollectionTitles = (collections = [], slugs = []) =>
  getCollectionsBySlug(collections, slugs).map((collection) => collection.title);

const applyProductCollectionMeta = (product, collections, slugs) => {
  const collectionSlugs = uniqueList(slugs);
  const categories = getCollectionTitles(collections, collectionSlugs);

  return {
    ...product,
    collectionSlug: collectionSlugs[0] || '',
    collectionSlugs,
    category: categories[0] || '',
    categories,
  };
};

const parseVariants = (value, fallbackSku = '') => {
  if (Array.isArray(value)) {
    return value;
  }

  return value
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [size = '', color = '', sku = '', stock = '0'] = line.split('|').map((part) => part.trim());
      return {
        id: `${fallbackSku || 'variant'}-${index + 1}`,
        size: size || 'One Size',
        color,
        sku: sku || (fallbackSku ? `${fallbackSku}-${index + 1}` : ''),
        stock: Number(stock || 0),
        isActive: true,
      };
    });
};

const buildInitialCollections = () =>
  Object.entries(collectionDefinitions).map(([slug, definition], index) => ({
    slug,
    title: definition.title,
    description: definition.description || '',
    featuredKeywords: parseList(definition.featuredKeywords || []),
    seoHeading: definition.seoHeading || '',
    seoBody: definition.seoBody || '',
    sortPriority: index + 1,
    isActive: definition.isActive ?? true,
  }));

const normalizeCollection = (collection, fallbackPriority = 99) => ({
  id: collection?.id || '',
  slug: slugify(collection?.slug || collection?.title || `collection-${fallbackPriority}`),
  title: (collection?.title || '').trim(),
  description: (collection?.description || '').trim(),
  featuredKeywords: parseList(collection?.featuredKeywords || []),
  seoHeading: (collection?.seoHeading || '').trim(),
  seoBody: (collection?.seoBody || '').trim(),
  sortPriority: Number(collection?.sortPriority || fallbackPriority),
  isActive: collection?.isActive ?? true,
  translations: collection?.translations || {},
  created_at: collection?.created_at,
  updated_at: collection?.updated_at,
});

const sortCollections = (collections = []) =>
  [...collections].sort((a, b) => {
    const priorityDiff = Number(a.sortPriority || 0) - Number(b.sortPriority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title, 'vi');
  });

const inferCollectionSlug = (product, collections) => {
  if (product?.collectionSlug) return product.collectionSlug;

  const source = [
    product?.category,
    product?.name,
    product?.description,
    ...(product?.styleTags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedCollection = collections.find((collection) =>
    collection.featuredKeywords.some((keyword) => source.includes(keyword.toLowerCase()))
  );

  return matchedCollection?.slug || '';
};

const buildInitialProducts = (collections) =>
  normalizeProducts(
    mockProducts.map((product) => ({
      ...product,
      collectionSlug: inferCollectionSlug(product, collections),
    }))
  );

const normalizeProductInput = (input, collections, existingProduct) => {
  const collectionSlugs = uniqueList([input.collectionSlug, ...parseList(input.collectionSlugs || [])]);
  const generatedSlug = slugify(input.slug || input.id || input.name || existingProduct?.slug || `product-${Date.now()}`);
  const generatedSku = (input.sku || existingProduct?.sku || generatedSlug).toString().trim().toUpperCase();
  const rawVariants =
    input.variants !== undefined && input.variants !== null ? input.variants : existingProduct?.variants || [];
  const parsedVariants = parseVariants(rawVariants, generatedSku);

  return applyProductCollectionMeta({
    ...existingProduct,
    slug: generatedSlug,
    sku: generatedSku,
    status: input.status || existingProduct?.status || 'active',
    name: (input.name || '').trim(),
    description: (input.description || '').trim(),
    price: Number(input.price || 0),
    compareAtPrice:
      input.compareAtPrice === '' || input.compareAtPrice === null || input.compareAtPrice === undefined
        ? undefined
        : Number(input.compareAtPrice),
    images: parseList(input.images || []),
    coverImage:
      (input.coverImage || '').trim() || parseList(input.images || [])[0] || existingProduct?.coverImage || '',
    variants: parsedVariants,
    styleTags: parseList(input.styleTags || []),
    material: (input.material || '').trim(),
    fitNotes: (input.fitNotes || '').trim(),
    seoTitle: (input.seoTitle || '').trim(),
    seoDescription: (input.seoDescription || '').trim(),
    isNew: Boolean(input.isNew),
    isBestSeller: Boolean(input.isBestSeller),
    isOnSale: Boolean(input.isOnSale),
    trendingScore: Number(input.trendingScore || 0),
    translations: input.translations || existingProduct?.translations || {},
    created_at: existingProduct?.created_at || new Date().toISOString(),
  }, collections, collectionSlugs);
};

const initialCollections = sortCollections(
  readStorage(COLLECTIONS_STORAGE_KEY, buildInitialCollections()).map((collection, index) =>
    normalizeCollection(collection, index + 1)
  )
);
const initialProducts = normalizeProducts(readStorage(PRODUCTS_STORAGE_KEY, buildInitialProducts(initialCollections)));

const persistCatalog = (products, collections) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CATALOG_SEED_VERSION_KEY, CATALOG_SEED_VERSION);
  }
  persistStorage(PRODUCTS_STORAGE_KEY, products);
  persistStorage(COLLECTIONS_STORAGE_KEY, collections);
};

const updateLocalProducts = (products, collections, input, existingId = null) => {
  const existingProduct = products.find((product) => product.id === existingId) || null;
  const nextProduct = normalizeProductInput(input, collections, existingProduct);

  if (!nextProduct.name) {
    return { ok: false, error: 'Tên sản phẩm là bắt buộc.' };
  }

  if (!nextProduct.collectionSlugs.length) {
    return { ok: false, error: 'Hãy chọn một danh mục cho sản phẩm.' };
  }

  if (!nextProduct.variants.length) {
    return { ok: false, error: 'Sản phẩm phải có ít nhất một biến thể.' };
  }

  const hasDuplicateSlug = products.some(
    (product) => product.slug === nextProduct.slug && product.id !== existingId
  );

  if (hasDuplicateSlug) {
    return { ok: false, error: 'Slug sản phẩm đang bị trùng. Hãy đổi tên sản phẩm.' };
  }

  const productForLocal = {
    ...nextProduct,
    id: existingProduct?.id || nextProduct.slug,
  };

  const nextProducts = existingProduct
    ? products.map((product) => (product.id === existingId ? productForLocal : product))
    : [productForLocal, ...products];

  return { ok: true, products: normalizeProducts(nextProducts), product: productForLocal };
};

const updateLocalCollections = (collections, products, input, previousSlug = null) => {
  const previousCollection = collections.find((collection) => collection.slug === previousSlug) || null;
  const nextCollection = normalizeCollection(
    {
      ...input,
      slug: input.slug || input.title,
    },
    collections.length + 1
  );

  if (!nextCollection.title) {
    return { ok: false, error: 'Tên danh mục là bắt buộc.' };
  }

  if (!nextCollection.slug) {
    return { ok: false, error: 'Slug danh mục chưa hợp lệ.' };
  }

  const hasDuplicateSlug = collections.some(
    (collection) => collection.slug === nextCollection.slug && collection.slug !== previousSlug
  );

  if (hasDuplicateSlug) {
    return { ok: false, error: 'Slug danh mục đang bị trùng.' };
  }

  const nextCollections = sortCollections(
    previousCollection
      ? collections.map((collection) => (collection.slug === previousSlug ? nextCollection : collection))
      : [...collections, nextCollection]
  );

  const nextProducts =
    previousCollection && (previousSlug !== nextCollection.slug || previousCollection.title !== nextCollection.title)
      ? products.map((product) => {
          const productCollectionSlugs = getProductCollectionSlugs(product);
          if (!productCollectionSlugs.includes(previousSlug)) return product;
          return applyProductCollectionMeta(
            product,
            nextCollections,
            productCollectionSlugs.map((slug) => (slug === previousSlug ? nextCollection.slug : slug))
          );
        })
      : products;

  return { ok: true, collections: nextCollections, products: nextProducts, collection: nextCollection };
};

const useCatalogStore = create((set, get) => ({
  products: initialProducts,
  collections: initialCollections,
  loading: false,
  error: '',
  source: 'local',
  hydrated: false,

  loadCatalog: async (force = false) => {
    const state = get();
    if (state.loading) return { ok: true, source: state.source };
    if (state.hydrated && !force) return { ok: true, source: state.source };

    set({ loading: true, error: '' });

    try {
      const [{ data: products }, { data: collections }] = await Promise.all([
        productsService.getAll({ limit: 500 }),
        productsService.getCollections(),
      ]);

      const normalizedCollections = sortCollections(
        (collections || []).map((collection, index) => normalizeCollection(collection, index + 1))
      );
      const normalizedProducts = normalizeProducts(products || []);

      if (normalizedCollections.length === 0) {
        set({
          loading: false,
          hydrated: true,
          source: 'local',
          error:
            normalizedProducts.length > 0
              ? 'Backend đã có product nhưng chưa có collections. Tiếp tục dùng catalog local cho đến khi collections được import.'
              : '',
        });
        return { ok: true, source: 'local', empty: true };
      }

      persistCatalog(normalizedProducts, normalizedCollections);
      set({
        products: normalizedProducts,
        collections: normalizedCollections,
        loading: false,
        hydrated: true,
        source: 'remote',
        error: '',
      });
      return { ok: true, source: 'remote' };
    } catch (error) {
      set({
        loading: false,
        hydrated: true,
        source: 'local',
        error: error?.response?.data?.detail || 'Không thể tải catalog từ backend. Đang dùng dữ liệu local.',
      });
      return { ok: false, error: error?.response?.data?.detail || 'Không thể tải catalog từ backend.' };
    }
  },

  importCatalogToBackend: async () => {
    const { products, collections } = get();

    try {
      await adminService.importCatalog({
        collections: collections.map(({ id, created_at, updated_at, ...collection }) => collection),
        products: products.map(({ id, category, categories, stock, sizes, colors, created_at, updated_at, ...product }) => product),
      });
      return await get().loadCatalog(true);
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể import catalog lên backend.' };
    }
  },

  upsertProduct: async (input, existingId = null) => {
    const { products, collections, source } = get();
    const localResult = updateLocalProducts(products, collections, input, existingId);
    if (!localResult.ok) return localResult;

    if (source !== 'remote') {
      persistCatalog(localResult.products, collections);
      set({ products: localResult.products });
      return { ok: true, product: localResult.product, source: 'local' };
    }

    try {
      const payload = { ...localResult.product };
      delete payload.id;
      delete payload.category;
      delete payload.categories;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.stock;
      delete payload.sizes;
      delete payload.colors;

      const response = existingId
        ? await adminService.updateProduct(existingId, payload)
        : await adminService.createProduct(payload);

      const remoteProduct = normalizeProducts([response.data])[0];
      const nextProducts = existingId
        ? products.map((product) => (product.id === existingId ? remoteProduct : product))
        : [remoteProduct, ...products];

      persistCatalog(nextProducts, collections);
      set({ products: normalizeProducts(nextProducts), error: '' });
      return { ok: true, product: remoteProduct, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể lưu sản phẩm lên backend.' };
    }
  },

  deleteProduct: async (productId) => {
    const { products, collections, source } = get();
    const nextProducts = products.filter((product) => product.id !== productId);

    if (source !== 'remote') {
      persistCatalog(nextProducts, collections);
      set({ products: nextProducts });
      return { ok: true, source: 'local' };
    }

    try {
      await adminService.deleteProduct(productId);
      persistCatalog(nextProducts, collections);
      set({ products: nextProducts, error: '' });
      return { ok: true, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể xóa sản phẩm trên backend.' };
    }
  },

  upsertCollection: async (input, previousSlug = null) => {
    const { collections, products, source } = get();
    const localResult = updateLocalCollections(collections, products, input, previousSlug);
    if (!localResult.ok) return localResult;

    if (source !== 'remote') {
      persistCatalog(localResult.products, localResult.collections);
      set({ collections: localResult.collections, products: localResult.products });
      return { ok: true, collection: localResult.collection, source: 'local' };
    }

    try {
      const payload = { ...localResult.collection };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      const response = previousSlug
        ? await adminService.updateCollection(previousSlug, payload)
        : await adminService.createCollection(payload);

      const remoteCollection = normalizeCollection(response.data);
      const nextCollections = previousSlug
        ? sortCollections(collections.map((collection) => (collection.slug === previousSlug ? remoteCollection : collection)))
        : sortCollections([...collections, remoteCollection]);

      const previousCollection = collections.find((collection) => collection.slug === previousSlug) || null;
      const nextProducts =
        previousSlug &&
        (previousSlug !== remoteCollection.slug || previousCollection?.title !== remoteCollection.title)
          ? products.map((product) =>
              getProductCollectionSlugs(product).includes(previousSlug)
                ? applyProductCollectionMeta(
                    product,
                    nextCollections,
                    getProductCollectionSlugs(product).map((slug) =>
                      slug === previousSlug ? remoteCollection.slug : slug
                    )
                  )
                : product
            )
          : products;

      persistCatalog(nextProducts, nextCollections);
      set({ collections: nextCollections, products: nextProducts, error: '' });
      return { ok: true, collection: remoteCollection, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể lưu danh mục lên backend.' };
    }
  },

  deleteCollection: async (slug) => {
    const { collections, products, source } = get();
    const linkedProducts = products.filter((product) => getProductCollectionSlugs(product).includes(slug));

    if (linkedProducts.length > 0) {
      return {
        ok: false,
        error: `Không thể xóa danh mục vì còn ${linkedProducts.length} sản phẩm đang gắn với danh mục này.`,
      };
    }

    const nextCollections = collections.filter((collection) => collection.slug !== slug);

    if (source !== 'remote') {
      persistCatalog(products, nextCollections);
      set({ collections: nextCollections });
      return { ok: true, source: 'local' };
    }

    try {
      await adminService.deleteCollection(slug);
      persistCatalog(products, nextCollections);
      set({ collections: nextCollections, error: '' });
      return { ok: true, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể xóa danh mục trên backend.' };
    }
  },

  resetCatalog: () => {
    const collections = sortCollections(buildInitialCollections());
    const products = buildInitialProducts(collections);
    persistCatalog(products, collections);
    set({ products, collections, source: 'local', hydrated: true, error: '' });
  },
}));

export const getCollectionLabel = (collections, slug) =>
  collections.find((collection) => collection.slug === slug)?.title || 'Chưa gán danh mục';

export const getCollectionLabels = (collections, slugs = []) => {
  const labels = uniqueList(slugs)
    .map((slug) => collections.find((collection) => collection.slug === slug)?.title)
    .filter(Boolean);

  return labels.length ? labels.join(', ') : 'Chưa gán danh mục';
};

export const getInitialCatalogSnapshot = () => ({
  products: clone(buildInitialProducts(sortCollections(buildInitialCollections()))),
  collections: clone(sortCollections(buildInitialCollections())),
});

export const getPublicProducts = (products = [], collections = []) => {
  const activeCollectionSlugs = new Set(
    collections.filter((collection) => collection.isActive !== false).map((collection) => collection.slug)
  );

  return normalizeProducts(products).filter(
    (product) => {
      const productCollectionSlugs = getProductCollectionSlugs(product);
      return (
        isPublicProduct(product) &&
        (!productCollectionSlugs.length || productCollectionSlugs.some((slug) => activeCollectionSlugs.has(slug)))
      );
    }
  );
};

export default useCatalogStore;
