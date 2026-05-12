import { create } from 'zustand';
import { getProductCollectionSlugs, isPublicProduct, normalizeProducts } from '../lib/catalog';
import { parseList, slugify, uniqueList } from '../lib/text';
import { adminService, productsService } from '../services';

const LEGACY_CATALOG_STORAGE_KEYS = ['catalog-products', 'catalog-collections', 'catalog-seed-version'];

const clearLegacyCatalogStorage = () => {
  if (typeof window === 'undefined') return;
  LEGACY_CATALOG_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

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

const normalizeCollection = (collection, fallbackPriority = 99) => ({
  id: collection?.id || '',
  slug: slugify(collection?.slug || collection?.title || `collection-${fallbackPriority}`),
  title: (collection?.title || '').trim(),
  description: (collection?.description || '').trim(),
  image: (collection?.image || '').trim(),
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

clearLegacyCatalogStorage();

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
  products: [],
  collections: [],
  loading: false,
  error: '',
  source: 'remote',
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

      if (normalizedCollections.length === 0 && normalizedProducts.length === 0) {
        set({
          products: [],
          collections: [],
          loading: false,
          hydrated: true,
          source: 'remote',
          error: '',
        });
        return { ok: true, source: 'remote', empty: true };
      }

      if (normalizedCollections.length === 0) {
        set({
          products: normalizedProducts,
          collections: [],
          loading: false,
          hydrated: true,
          source: 'remote',
          error: normalizedProducts.length > 0
            ? 'Backend đã có product nhưng chưa có collections. Storefront sẽ chỉ hiển thị theo dữ liệu backend hiện tại.'
            : '',
        });
        return { ok: true, source: 'remote', empty: true };
      }

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
        products: [],
        collections: [],
        loading: false,
        hydrated: true,
        source: 'remote',
        error: error?.response?.data?.detail || 'Không thể tải catalog từ backend.',
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
    const { products, collections } = get();
    const localResult = updateLocalProducts(products, collections, input, existingId);
    if (!localResult.ok) return localResult;

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

      set({ products: normalizeProducts(nextProducts), error: '' });
      return { ok: true, product: remoteProduct, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể lưu sản phẩm lên backend.' };
    }
  },

  deleteProduct: async (productId) => {
    const { products } = get();
    const nextProducts = products.filter((product) => product.id !== productId);

    try {
      await adminService.deleteProduct(productId);
      set({ products: nextProducts, error: '' });
      return { ok: true, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể xóa sản phẩm trên backend.' };
    }
  },

  upsertCollection: async (input, previousSlug = null) => {
    const { collections, products } = get();
    const localResult = updateLocalCollections(collections, products, input, previousSlug);
    if (!localResult.ok) return localResult;

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

      set({ collections: nextCollections, products: nextProducts, error: '' });
      return { ok: true, collection: remoteCollection, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể lưu danh mục lên backend.' };
    }
  },

  deleteCollection: async (slug) => {
    const { collections, products } = get();
    const linkedProducts = products.filter((product) => getProductCollectionSlugs(product).includes(slug));

    if (linkedProducts.length > 0) {
      return {
        ok: false,
        error: `Không thể xóa danh mục vì còn ${linkedProducts.length} sản phẩm đang gắn với danh mục này.`,
      };
    }

    const nextCollections = collections.filter((collection) => collection.slug !== slug);

    try {
      await adminService.deleteCollection(slug);
      set({ collections: nextCollections, error: '' });
      return { ok: true, source: 'remote' };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.detail || 'Không thể xóa danh mục trên backend.' };
    }
  },

  resetCatalog: () => {
    clearLegacyCatalogStorage();
    set({ products: [], collections: [], source: 'remote', hydrated: true, error: '' });
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
