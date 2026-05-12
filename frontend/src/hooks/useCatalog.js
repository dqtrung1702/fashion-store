import { useEffect, useMemo } from 'react';
import useCatalogStore, { getPublicProducts } from '../store/catalogStore';

export default function useCatalog(limit = 100) {
  const products = useCatalogStore((state) => state.products);
  const collections = useCatalogStore((state) => state.collections);
  const loading = useCatalogStore((state) => state.loading);
  const error = useCatalogStore((state) => state.error);
  const hydrated = useCatalogStore((state) => state.hydrated);
  const loadCatalog = useCatalogStore((state) => state.loadCatalog);

  useEffect(() => {
    if (!hydrated) {
      loadCatalog();
    }
  }, [hydrated, loadCatalog]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const refreshCatalog = () => {
      if (document.visibilityState === 'visible') {
        loadCatalog(true);
      }
    };

    window.addEventListener('focus', refreshCatalog);
    document.addEventListener('visibilitychange', refreshCatalog);

    return () => {
      window.removeEventListener('focus', refreshCatalog);
      document.removeEventListener('visibilitychange', refreshCatalog);
    };
  }, [loadCatalog]);

  const activeCollections = useMemo(
    () => collections.filter((collection) => collection.isActive !== false),
    [collections]
  );
  const categories = useMemo(
    () => activeCollections.map((collection) => collection.title),
    [activeCollections]
  );
  const publicProducts = useMemo(
    () => getPublicProducts(products, activeCollections),
    [products, activeCollections]
  );
  const limitedProducts = useMemo(
    () => publicProducts.slice(0, limit),
    [publicProducts, limit]
  );

  return {
    products: limitedProducts,
    allProducts: products,
    categories,
    collections: activeCollections,
    loading,
    error,
  };
}
