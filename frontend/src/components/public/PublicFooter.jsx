import React from 'react';
import { Link } from 'react-router-dom';
import { localizeEntity } from '../../i18n/entities';
import { getUiText } from '../../i18n/ui';
import useCatalogStore from '../../store/catalogStore';
import useContentStore from '../../store/contentStore';
import useLanguageStore from '../../store/languageStore';

export default function PublicFooter() {
  const collections = useCatalogStore((state) => state.collections);
  const footerGroups = useContentStore((state) => state.footerGroups);
  const siteChrome = useContentStore((state) => state.siteChrome);
  const locale = useLanguageStore((state) => state.locale);
  const dynamicFooterGroups = [
    footerGroups[0],
    {
      title: getUiText(locale, 'categories'),
      links: collections
        .filter((collection) => collection.isActive !== false)
        .slice(0, 5)
        .map((collection) => {
          const localizedCollection = localizeEntity(collection, locale);
          return {
            label: localizedCollection.title,
            to: `/collections/${collection.slug}`,
          };
        }),
    },
    footerGroups[2],
  ];

  return (
    <footer className="mt-20 border-t border-white/35 bg-[linear-gradient(135deg,rgba(242,215,210,0.36),rgba(223,233,228,0.42)_42%,rgba(244,232,199,0.30))] backdrop-blur-sm">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{siteChrome.brandName}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-slate-950">{siteChrome.footerHeading}</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
            {siteChrome.footerDescription}
          </p>
        </div>

        {dynamicFooterGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{group.title}</h3>
            <div className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-slate-700 transition hover:text-slate-950">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
