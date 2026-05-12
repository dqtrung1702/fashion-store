import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import useCatalog from '../hooks/useCatalog';
import { getUiText } from '../i18n/ui';
import { matchesCollection, titleize } from '../lib/catalog';
import useContentStore from '../store/contentStore';
import useLanguageStore from '../store/languageStore';

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
      <div className="rounded-[2rem] border border-white/65 bg-[linear-gradient(135deg,rgba(252,246,242,0.78),rgba(233,223,220,0.68))] px-8 py-16 text-center shadow-sm backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{titleize(sectionKey)}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-slate-950">{getUiText(locale, 'noPage')}</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.description} image={page.image || ''}>
        <div className="flex flex-wrap gap-3">
          {(page.bullets || []).map((bullet) => (
            <span key={bullet} className="rounded-full border border-white/20 bg-[rgba(255,245,238,0.14)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_18px_rgba(20,24,22,0.10)] backdrop-blur-sm">
              {bullet}
            </span>
          ))}
        </div>
      </PageHero>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(242,215,210,0.82),rgba(223,233,228,0.76)_52%,rgba(184,216,159,0.66))] p-10 text-slate-950 shadow-[0_28px_72px_rgba(166,99,91,0.10)] backdrop-blur-sm">
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

        <div className="grid gap-4 rounded-[2rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,249,244,0.80),rgba(223,233,228,0.64))] p-6 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {getUiText(locale, 'featuredSuggestions')}
          </p>
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => <ProductCard key={product.id} product={product} eyebrow={page.eyebrow} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d8c8bc] bg-[rgba(255,249,244,0.42)] px-6 py-10 text-center text-slate-600">
              {getUiText(locale, 'noProductsForEditorial')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
