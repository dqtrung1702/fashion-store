import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import useCatalog from '../hooks/useCatalog';
import { getUiText } from '../i18n/ui';
import { matchesCollection, titleize } from '../lib/catalog';
import useContentStore from '../store/contentStore';
import useLanguageStore from '../store/languageStore';

const editorialImages = {
  'ao-dai-hoi-he':
    'https://images.pexels.com/photos/36214254/pexels-photo-36214254.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
  'dong-phuc-tap-the':
    'https://images.pexels.com/photos/32279111/pexels-photo-32279111.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
  'tet-hoi-xuan':
    'https://images.pexels.com/photos/35146267/pexels-photo-35146267.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85',
};

export default function EditorialLandingPage({ sectionKey }) {
  const { slug } = useParams();
  const locale = useLanguageStore((state) => state.locale);
  const editorialPages = useContentStore((state) => state.editorialPages);
  const page = editorialPages[sectionKey]?.[slug];
  const { products, collections } = useCatalog();
  const featuredCollection = collections.find((collection) => collection.isActive !== false) || collections[0];
  const featuredProducts = featuredCollection
    ? products.filter((product) => matchesCollection(product, featuredCollection)).slice(0, 3)
    : products.slice(0, 3);

  if (!page) {
    return (
      <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{titleize(sectionKey)}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-slate-950">{getUiText(locale, 'noPage')}</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.description} image={page.image || editorialImages[slug]}>
        <div className="flex flex-wrap gap-3">
          {(page.bullets || []).map((bullet) => (
            <span key={bullet} className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              {bullet}
            </span>
          ))}
        </div>
      </PageHero>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,#f2d7d2,#dfe9e4_52%,#b8d89f)] p-10 text-slate-950 shadow-[0_35px_90px_rgba(166,99,91,0.13)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            {getUiText(locale, 'direction')}
          </p>
          <h2 className="mt-5 font-display text-4xl leading-tight">
            {getUiText(locale, 'editorialDirectionTitle')}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700">
            {getUiText(locale, 'editorialDirectionBody')}
          </p>
          <Link
            to={page.cta.to}
            className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {page.cta.label}
          </Link>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {getUiText(locale, 'featuredSuggestions')}
          </p>
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => <ProductCard key={product.id} product={product} eyebrow={page.eyebrow} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-slate-600">
              {getUiText(locale, 'noProductsForEditorial')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
