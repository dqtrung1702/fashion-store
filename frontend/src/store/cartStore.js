import { create } from 'zustand';
import { cartService } from '../services';

const STORAGE_KEY = 'cart-items';

const readLocalItems = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const persistLocal = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const clearLocal = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const hasAuthToken = () => Boolean(localStorage.getItem('token'));

const getItemKey = (item) => item?.variant_id || item?.variant_sku || `${item?.product_id}-${item?.size}-${item?.color || ''}`;

const toFiniteQuantity = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const normalizeLocalItem = (item) => ({
  ...item,
  quantity: Math.max(1, toFiniteQuantity(item?.quantity || 1)),
  max_quantity: Math.max(0, toFiniteQuantity(item?.max_quantity || 0)),
  available: item?.available !== false,
});

const summarizeNames = (names = []) => {
  const uniqueNames = [...new Set(names.filter(Boolean))];
  if (!uniqueNames.length) return '';
  if (uniqueNames.length <= 2) return uniqueNames.join(', ');
  return `${uniqueNames.slice(0, 2).join(', ')} và ${uniqueNames.length - 2} sản phẩm khác`;
};

const findProductInCatalog = (products, item) =>
  products.find((product) => product.id === item.product_id) ||
  products.find((product) => product.slug === item.product_id) ||
  products.find((product) => product.id === item.slug) ||
  null;

const findVariantInProduct = (product, item) =>
  (product?.variants || []).find((variant) => variant.id === item.variant_id) ||
  (product?.variants || []).find((variant) => variant.sku === item.variant_sku) ||
  (product?.variants || []).find(
    (variant) =>
      (variant.size || 'One Size') === (item.size || 'One Size') &&
      (variant.color || '') === (item.color || '')
  ) ||
  null;

const syncLocalItemsWithCatalog = (items, products = []) =>
  items.map((rawItem) => {
    const item = normalizeLocalItem(rawItem);
    const product = findProductInCatalog(products, item);

    if (!product) {
      return {
        ...item,
        available: false,
        max_quantity: 0,
      };
    }

    const variant = findVariantInProduct(product, item);
    const maxQuantity = Math.max(0, toFiniteQuantity((variant || {}).stock ?? product.stock ?? 0));
    const nextQuantity = maxQuantity > 0 ? Math.min(item.quantity, maxQuantity) : item.quantity;

    return {
      ...item,
      product_id: product.id,
      product_name: product.name || item.product_name,
      image: product.coverImage || product.images?.[0] || item.image || '',
      category: product.category || item.category || '',
      slug: product.slug || item.slug || '',
      price:
        variant?.price === undefined || variant?.price === null
          ? Number(product.price || item.price || 0)
          : Number(variant.price),
      size: variant?.size || item.size || 'One Size',
      color: variant?.color || item.color || '',
      variant_id: variant?.id || item.variant_id || null,
      variant_sku: variant?.sku || item.variant_sku || null,
      quantity: nextQuantity,
      max_quantity: maxQuantity,
      available: maxQuantity > 0,
    };
  });

const buildSyncNotice = (previousItems = [], nextItems = []) => {
  const previousByKey = new Map(previousItems.map((item) => [getItemKey(item), normalizeLocalItem(item)]));
  const unavailableNames = [];
  const reducedNames = [];

  nextItems.forEach((item) => {
    const previous = previousByKey.get(getItemKey(item));
    if (!previous) return;

    if (previous.available !== false && item.available === false) {
      unavailableNames.push(item.product_name || previous.product_name || 'Sản phẩm');
    }

    if (item.available !== false && item.quantity < previous.quantity) {
      reducedNames.push(item.product_name || previous.product_name || 'Sản phẩm');
    }
  });

  const messages = [];
  if (unavailableNames.length) {
    messages.push(`Một số sản phẩm đã chuyển sang hết hàng: ${summarizeNames(unavailableNames)}.`);
  }
  if (reducedNames.length) {
    messages.push(`Hệ thống đã tự giảm số lượng theo tồn kho mới: ${summarizeNames(reducedNames)}.`);
  }

  return messages.join(' ');
};

const areLocalItemsEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;

  return left.every((leftItem, index) => {
    const rightItem = right[index];
    if (!rightItem) return false;

    return (
      getItemKey(leftItem) === getItemKey(rightItem) &&
      (leftItem.product_id || '') === (rightItem.product_id || '') &&
      (leftItem.product_name || '') === (rightItem.product_name || '') &&
      (leftItem.image || '') === (rightItem.image || '') &&
      (leftItem.category || '') === (rightItem.category || '') &&
      (leftItem.slug || '') === (rightItem.slug || '') &&
      Number(leftItem.price || 0) === Number(rightItem.price || 0) &&
      (leftItem.size || '') === (rightItem.size || '') &&
      (leftItem.color || '') === (rightItem.color || '') &&
      (leftItem.variant_id || '') === (rightItem.variant_id || '') &&
      (leftItem.variant_sku || '') === (rightItem.variant_sku || '') &&
      Number(leftItem.quantity || 0) === Number(rightItem.quantity || 0) &&
      Number(leftItem.max_quantity || 0) === Number(rightItem.max_quantity || 0) &&
      Boolean(leftItem.available) === Boolean(rightItem.available)
    );
  });
};

const setLocalItems = (set, items) => {
  const normalizedItems = items.map(normalizeLocalItem);
  persistLocal(normalizedItems);
  set({
    items: normalizedItems,
    source: 'local',
    loading: false,
    hydrated: true,
    error: '',
    syncNotice: '',
  });
};

const setRemoteItems = (set, payload) => {
  set({
    items: payload?.items || [],
    source: 'backend',
    loading: false,
    hydrated: true,
    error: '',
  });
};

const findExistingItem = (items, productId, size, color = '', variantId = '', variantSku = '') =>
  items.find(
    (item) =>
      getItemKey(item) === (variantId || variantSku || `${productId}-${size}-${color || ''}`)
  );

const useCartStore = create((set, get) => ({
  items: readLocalItems().map(normalizeLocalItem),
  source: hasAuthToken() ? 'backend' : 'local',
  loading: false,
  hydrated: false,
  error: '',
  syncNotice: '',

  loadCart: async () => {
    if (!hasAuthToken()) {
      setLocalItems(set, readLocalItems());
      return;
    }

    try {
      set({ loading: true, error: '' });
      const { data } = await cartService.get();
      setRemoteItems(set, data);
    } catch (error) {
      set({
        items: [],
        source: 'backend',
        loading: false,
        hydrated: true,
        error: error?.response?.data?.detail || 'Không thể tải giỏ hàng',
        syncNotice: '',
      });
    }
  },

  addItem: async (item) => {
    if (!hasAuthToken()) {
      const normalizedItem = normalizeLocalItem(item);
      const maxQuantity = normalizedItem.max_quantity;
      if (normalizedItem.available === false || maxQuantity === 0) {
        throw new Error('Biến thể này hiện không còn hàng.');
      }

      const nextItemKey = getItemKey(item);
      const existing = get().items.find((entry) => getItemKey(entry) === nextItemKey);
      const nextQuantity = (existing?.quantity || 0) + normalizedItem.quantity;
      if (maxQuantity > 0 && nextQuantity > maxQuantity) {
        throw new Error('Số lượng vượt quá tồn kho hiện có.');
      }

      const nextItems = existing
        ? get().items.map((entry) =>
            getItemKey(entry) === nextItemKey
              ? {
                  ...entry,
                  quantity: nextQuantity,
                  max_quantity: maxQuantity,
                  available: true,
                }
              : entry
          )
        : [...get().items, normalizedItem];

      setLocalItems(set, nextItems);
      return nextItems;
    }

    const payload = {
      product_id: item.product_id,
      quantity: item.quantity || 1,
      variant_id: item.variant_id || null,
      variant_sku: item.variant_sku || null,
    };

    const { data } = await cartService.addItem(payload);
    setRemoteItems(set, data);
    return data.items || [];
  },

  removeItem: async (productId, size, color = '', variantId = '', variantSku = '') => {
    if (!hasAuthToken()) {
      const nextItems = get().items.filter(
        (item) => getItemKey(item) !== (variantId || variantSku || `${productId}-${size}-${color || ''}`)
      );
      setLocalItems(set, nextItems);
      return nextItems;
    }

    const existing = findExistingItem(get().items, productId, size, color, variantId, variantSku);
    const { data } = await cartService.removeItem(
      existing?.product_id || productId,
      existing?.variant_id || variantId || null,
      existing?.variant_sku || variantSku || null
    );
    setRemoteItems(set, data);
    return data.items || [];
  },

  updateQuantity: async (productId, size, quantity, color = '', variantId = '', variantSku = '') => {
    const nextQuantity = Math.max(1, Number(quantity || 1));

    if (!hasAuthToken()) {
      const existing = findExistingItem(get().items, productId, size, color, variantId, variantSku);
      if (!existing) return get().items;
      if (existing.available === false || existing.max_quantity === 0) {
        throw new Error('Biến thể này hiện không còn hàng.');
      }
      if (existing.max_quantity > 0 && nextQuantity > existing.max_quantity) {
        throw new Error('Số lượng vượt quá tồn kho hiện có.');
      }

      const nextItems = get().items.map((item) =>
        getItemKey(item) === (variantId || variantSku || `${productId}-${size}-${color || ''}`)
          ? { ...item, quantity: nextQuantity }
          : item
      );
      setLocalItems(set, nextItems);
      return nextItems;
    }

    const existing = findExistingItem(get().items, productId, size, color, variantId, variantSku);
    if (!existing) return get().items;

    const { data } = await cartService.updateItem(existing.product_id || productId, {
      quantity: nextQuantity,
      variant_id: existing.variant_id || variantId || null,
      variant_sku: existing.variant_sku || variantSku || null,
    });
    setRemoteItems(set, data);
    return data.items || [];
  },

  syncAvailability: (products = []) => {
    if (hasAuthToken()) return get().items;
    const previousItems = get().items;
    const nextItems = syncLocalItemsWithCatalog(previousItems, products);
    const syncNotice = buildSyncNotice(previousItems, nextItems);
    const normalizedItems = nextItems.map(normalizeLocalItem);
    if (areLocalItemsEqual(previousItems, normalizedItems) && (get().syncNotice || '') === syncNotice) {
      return previousItems;
    }
    persistLocal(normalizedItems);
    set({
      items: normalizedItems,
      source: 'local',
      loading: false,
      hydrated: true,
      error: '',
      syncNotice,
    });
    return nextItems;
  },

  clearSyncNotice: () => set({ syncNotice: '' }),

  clearCart: async () => {
    if (!hasAuthToken()) {
      clearLocal();
      set({ items: [], source: 'local', loading: false, hydrated: true, error: '', syncNotice: '' });
      return;
    }

    await cartService.clear();
    set({ items: [], source: 'backend', loading: false, hydrated: true, error: '', syncNotice: '' });
  },

  getTotal: () =>
    get().items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),

  getCount: () =>
    get().items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
}));

export default useCartStore;
