import React from 'react';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import useCatalog from '../hooks/useCatalog';
import { getUiText } from '../i18n/ui';
import useContentStore from '../store/contentStore';
import useLanguageStore from '../store/languageStore';

const sortStrategies = {
  'new-in': (products) =>
    [...products]
      .filter((product) => product.isNew)
      .sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ),
  bestsellers: (products) => [...products].filter((product) => product.isBestSeller),
  sale: (products) =>
    [...products]
      .filter((product) => product.isOnSale)
      .sort((a, b) => a.price - b.price),
};

export default function MerchandisingPage({ pageKey }) {
  const { products, loading, error } = useCatalog();
  const locale = useLanguageStore((state) => state.locale);
  const merchandisingPages = useContentStore((state) => state.merchandisingPages);
  const page = merchandisingPages[pageKey];
  const sortedProducts = sortStrategies[pageKey] ? sortStrategies[pageKey](products) : products;

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        image={page?.image || ''}
      />

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-3xl border border-white/65 bg-[linear-gradient(135deg,rgba(252,246,242,0.78),rgba(233,223,220,0.68))] px-6 py-16 text-center text-slate-600 shadow-sm backdrop-blur-sm">
          {getUiText(locale, 'loadingProducts')}
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              eyebrow={page.title}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-[#d8c8bc] bg-[linear-gradient(135deg,rgba(255,249,244,0.78),rgba(242,215,210,0.60))] px-8 py-16 text-center text-slate-600 backdrop-blur-sm">
          {getUiText(locale, 'noMatchingProducts')}
        </div>
      )}
    </div>
  );
}
