import React from 'react';
import { Link } from 'react-router-dom';
import { localizeEntity } from '../../i18n/entities';
import { badgeText, getUiText } from '../../i18n/ui';
import { formatCurrency, getProductBadges } from '../../lib/catalog';
import useLanguageStore from '../../store/languageStore';

export default function ProductCard({
  product,
  eyebrow,
  showBadges = true,
  onQuickAdd,
}) {
  const locale = useLanguageStore((state) => state.locale);
  const localizedProduct = localizeEntity(product, locale);
  const badges = showBadges ? getProductBadges(localizedProduct, locale) : [];
  const labels = badgeText[locale] || badgeText.vi;

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,249,244,0.88),rgba(246,238,228,0.82))] shadow-[0_16px_38px_rgba(166,99,91,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(184,216,159,0.14)]">
      <div className="relative">
        <Link to={`/products/${localizedProduct.id}`} className="block">
          <div className="aspect-[3/4] overflow-hidden bg-slate-100">
            {localizedProduct.coverImage || localizedProduct.images?.[0] ? (
              <img
                src={localizedProduct.coverImage || localizedProduct.images[0]}
                alt={localizedProduct.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.25em] text-slate-400">
                {getUiText(locale, 'noImage')}
              </div>
            )}
          </div>
        </Link>

        {badges.length > 0 ? (
          <div className="pointer-events-none absolute left-4 top-4 flex max-w-[70%] flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  badge === labels.sale
                    ? 'bg-[#c97968] text-white'
                    : badge === labels.lowStock
                    ? 'bg-[#f4e8c7] text-[#7b612d]'
                    : 'bg-[rgba(255,248,240,0.82)] text-slate-900'
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <Link to={`/products/${localizedProduct.id}`} className="block">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{eyebrow}</p>
          )}
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{localizedProduct.name}</h3>
          {localizedProduct.category ? (
            <p className="mt-1 text-sm text-slate-500">{localizedProduct.category}</p>
          ) : null}
        </Link>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">{formatCurrency(localizedProduct.price)}</p>
            {localizedProduct.compareAtPrice ? (
              <p className="text-sm text-slate-400 line-through">{formatCurrency(localizedProduct.compareAtPrice)}</p>
            ) : null}
          </div>
          <p className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {locale === 'en' ? `${localizedProduct.stock} ready` : `Còn ${localizedProduct.stock} bộ`}
          </p>
        </div>

        {localizedProduct.styleTags?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localizedProduct.styleTags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-[rgba(223,233,228,0.76)] px-3 py-1 text-xs font-semibold text-[#51645a]">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {onQuickAdd ? (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {getUiText(locale, 'addQuick')}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
