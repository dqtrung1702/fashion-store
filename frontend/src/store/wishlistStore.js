import { create } from 'zustand';
import { wishlistService } from '../services';

const STORAGE_KEY = 'wishlist-items';

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

const useWishlistStore = create((set, get) => ({
  items: readLocalItems(),
  source: hasAuthToken() ? 'backend' : 'local',
  hydrated: false,
  loading: false,
  error: '',

  loadWishlist: async () => {
    if (!hasAuthToken()) {
      set({
        items: readLocalItems(),
        source: 'local',
        hydrated: true,
        loading: false,
        error: '',
      });
      return;
    }

    try {
      set({ loading: true, error: '' });
      const { data } = await wishlistService.get();
      set({
        items: data?.items || [],
        source: 'backend',
        hydrated: true,
        loading: false,
        error: '',
      });
    } catch (error) {
      set({
        items: [],
        source: 'backend',
        hydrated: true,
        loading: false,
        error: error?.response?.data?.detail || 'Không thể tải danh sách yêu thích',
      });
    }
  },

  toggleItem: async (item) => {
    const exists = get().items.some((entry) => entry.id === item.id);

    if (!hasAuthToken()) {
      const nextItems = exists
        ? get().items.filter((entry) => entry.id !== item.id)
        : [item, ...get().items];

      persistLocal(nextItems);
      set({ items: nextItems, source: 'local', hydrated: true, loading: false, error: '' });
      return nextItems;
    }

    const response = exists
      ? await wishlistService.removeItem(item.id)
      : await wishlistService.addItem(item.id);

    set({
      items: response.data?.items || [],
      source: 'backend',
      hydrated: true,
      loading: false,
      error: '',
    });
    return response.data?.items || [];
  },

  removeItem: async (id) => {
    if (!hasAuthToken()) {
      const nextItems = get().items.filter((entry) => entry.id !== id);
      persistLocal(nextItems);
      set({ items: nextItems, source: 'local', hydrated: true, loading: false, error: '' });
      return nextItems;
    }

    const { data } = await wishlistService.removeItem(id);
    set({
      items: data?.items || [],
      source: 'backend',
      hydrated: true,
      loading: false,
      error: '',
    });
    return data?.items || [];
  },

  hasItem: (id) => get().items.some((entry) => entry.id === id),

  clear: async () => {
    if (!hasAuthToken()) {
      clearLocal();
      set({ items: [], source: 'local', hydrated: true, loading: false, error: '' });
      return;
    }

    await wishlistService.clear();
    set({ items: [], source: 'backend', hydrated: true, loading: false, error: '' });
  },
}));

export default useWishlistStore;
