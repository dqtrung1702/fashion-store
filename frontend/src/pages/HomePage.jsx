import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/public/ProductCard';
import useCatalog from '../hooks/useCatalog';
import { localizeEntity } from '../i18n/entities';
import { getUiText } from '../i18n/ui';
import { getProductCollectionSlugs } from '../lib/catalog';
import useContentStore, { contentOptionEntries } from '../store/contentStore';
import useLanguageStore from '../store/languageStore';

const sectionTitleClass = 'mt-3 max-w-4xl font-display text-4xl leading-tight text-slate-950';
const getExcerpt = (value = '', maxLength = 150) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
};
const getProductImage = (product = {}) => product.coverImage || product.images?.[0] || '';
const primaryCampaignSlug = 'ao-dai-hoi-he';
const heroImage =
  'https://images.pexels.com/photos/36214254/pexels-photo-36214254.jpeg?auto=compress&cs=tinysrgb&w=1800&q=85';
const editorialFallbackImages = {
  campaigns: 'https://images.pexels.com/photos/36214254/pexels-photo-36214254.jpeg?auto=compress&cs=tinysrgb&w=1200&q=80',
  lookbook: 'https://images.pexels.com/photos/32279111/pexels-photo-32279111.jpeg?auto=compress&cs=tinysrgb&w=1200&q=80',
  occasions: 'https://images.pexels.com/photos/35146267/pexels-photo-35146267.jpeg?auto=compress&cs=tinysrgb&w=1200&q=80',
};
const editorialRouteBase = {
  campaigns: '/campaigns',
  lookbook: '/lookbook',
  occasions: '/occasions',
};

export default function HomePage() {
  const { products, collections, loading, error } = useCatalog();
  const locale = useLanguageStore((state) => state.locale);
  const homePageContent = useContentStore((state) => state.homePageContent);
  const editorialPages = useContentStore((state) => state.editorialPages);
  const hero = homePageContent.hero || {};
  const heroStats = homePageContent.heroStats || [];
  const campaignBanner = homePageContent.campaignBanner || {};
  const sectionControls = homePageContent.sectionControls || {};
  const getSection = (key, fallback = {}) => ({
    ...fallback,
    ...(sectionControls[key] || {}),
  });
  const isSectionEnabled = (key) => getSection(key).enabled !== false;
  const sections = {
    campaigns: getSection('campaigns', {
      eyebrow: 'Chiến dịch nổi bật',
      title: 'Nội dung campaign đang được quản lý từ admin.',
    }),
    newIn: getSection('newIn', {
      eyebrow: 'Mới về',
      title: 'Những sản phẩm vừa lên kệ để làm mới cả tủ đồ.',
      ctaLabel: 'Xem toàn bộ',
      ctaTo: '/new-in',
    }),
    bestsellers: getSection('bestsellers', {
      eyebrow: 'Bán chạy',
      title: 'Những món khách hàng quay lại nhiều nhất.',
      ctaLabel: 'Xem hàng bán chạy',
      ctaTo: '/bestsellers',
    }),
    categories: getSection('categories', {
      eyebrow: 'Mua theo danh mục',
      title: 'Đi thẳng vào nhóm sản phẩm bạn đang cần.',
    }),
    occasions: getSection('occasions', {
      eyebrow: 'Mua theo dịp',
      title: 'Chọn nhanh theo bối cảnh mặc thay vì chỉ theo loại sản phẩm.',
    }),
    reviews: getSection('reviews', {
      eyebrow: 'Đánh giá khách hàng',
      title: 'Social proof để kéo niềm tin ngay trên trang chủ.',
    }),
    ugc: getSection('ugc', {
      eyebrow: 'UGC / Mạng xã hội',
      title: 'Instagram và TikTok ngay trên homepage.',
    }),
  };
  const newInProducts = products.filter((product) => product.isNew).slice(0, 4);
  const bestsellingProducts = products.filter((product) => product.isBestSeller).slice(0, 4);
  const categoryCards = collections.filter((collection) => collection.isActive !== false).slice(0, 5);
  const activeCollectionSlugs = new Set(collections.map((collection) => collection.slug));
  const fallbackCollectionTo = categoryCards[0] ? `/collections/${categoryCards[0].slug}` : '/new-in';
  const resolveCollectionLink = (to) => {
    const collectionMatch = typeof to === 'string' ? to.match(/^\/collections\/([^/?#]+)/) : null;
    if (collectionMatch && !activeCollectionSlugs.has(collectionMatch[1])) {
      return fallbackCollectionTo;
    }
    return to || fallbackCollectionTo;
  };
  const getCollectionImage = (collection) =>
    getProductImage(products.find((product) => getProductCollectionSlugs(product).includes(collection.slug))) || heroImage;
  const collectionCards = categoryCards.map((collection) => {
    const localizedCollection = localizeEntity(collection, locale);
    return {
      eyebrow: getUiText(locale, 'collectionFallback'),
      title: localizedCollection.title,
      description: localizedCollection.description,
      to: `/collections/${collection.slug}`,
      image: getCollectionImage(collection),
    };
  });
  const editorialCards = contentOptionEntries.editorial
    .map((entry) => {
      const page = editorialPages[entry.sectionKey]?.[entry.slug];
      if (!page?.title) return null;
      return {
        ...page,
        to: `${editorialRouteBase[entry.sectionKey]}/${entry.slug}`,
        image: page.image || editorialFallbackImages[entry.sectionKey] || heroImage,
      };
    })
    .filter(Boolean);
  const fallbackCampaignCard = {
      eyebrow: campaignBanner.eyebrow || editorialPages.campaigns[primaryCampaignSlug]?.eyebrow,
      title: campaignBanner.title || editorialPages.campaigns[primaryCampaignSlug]?.title,
      description: campaignBanner.description || editorialPages.campaigns[primaryCampaignSlug]?.description,
      cta: {
        label: campaignBanner.ctaLabel || editorialPages.campaigns[primaryCampaignSlug]?.cta?.label,
      },
      to: campaignBanner.to || `/campaigns/${primaryCampaignSlug}`,
      image: editorialCards[0]?.image || editorialFallbackImages.campaigns,
  };
  const campaignCards = [
    editorialCards[0] || fallbackCampaignCard,
    ...editorialCards.slice(1, 3),
  ];

  return (
    <div className="space-y-10">
      <section className="border-y border-white/70 py-4">
        <div className="grid gap-0 md:grid-cols-5">
          {homePageContent.uspItems.map((item) => (
            <div
              key={item.title}
              className="border-white/70 px-4 py-3 md:border-l md:first:border-l-0"
            >
              <span className="mb-2 block h-0.5 w-8 bg-[#c97968]" />
              <span className="block text-sm font-bold text-slate-950">{item.title}</span>
              {item.detail ? (
                <span className="mt-1 block font-display text-lg leading-snug text-slate-600">{item.detail}</span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="relative flex min-h-[620px] items-end overflow-hidden rounded-[2.5rem] border border-white/70 bg-cover bg-center px-7 py-10 text-white shadow-[0_40px_110px_rgba(166,99,91,0.14)] md:px-10 md:py-14"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(20,24,22,0.10) 0%, rgba(20,24,22,0.84) 100%), url(${heroImage})`,
          }}
        >
          <div className="relative max-w-3xl rounded-[1.75rem] bg-slate-950/25 p-5 backdrop-blur-sm md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/90">
              {hero.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white">
              {getExcerpt(hero.description, 115)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={resolveCollectionLink(hero.primaryCtaTo)}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {hero.primaryCtaLabel}
              </Link>
              <Link
                to={resolveCollectionLink(hero.secondaryCtaTo)}
                className="rounded-full border border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {hero.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={`${stat.label}-${stat.value}`}
                  className="rounded-[1.5rem] border border-white/30 bg-white/15 p-4 backdrop-blur"
                >
                  <p className="text-sm uppercase tracking-[0.16em] text-white/80">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {campaignCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group relative min-h-[190px] overflow-hidden rounded-[1.9rem] border border-white/70 bg-slate-950 shadow-sm transition hover:-translate-y-1"
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="relative flex min-h-[190px] flex-col justify-end p-6 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                  {card.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-2xl leading-tight">{card.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {isSectionEnabled('campaigns') ? (
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {sections.campaigns.eyebrow}
            </p>
            <h2 className={sectionTitleClass}>{sections.campaigns.title}</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            to={campaignCards[0].to}
            className="relative flex min-h-[480px] items-end overflow-hidden rounded-[2.2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-[0_35px_90px_rgba(166,99,91,0.13)]"
          >
            <img src={campaignCards[0].image} alt={campaignCards[0].title} className="absolute inset-0 h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                {campaignCards[0].eyebrow}
              </p>
              <h3 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{campaignCards[0].title}</h3>
              {campaignCards[0].cta?.label ? (
                <span className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">{campaignCards[0].cta.label}</span>
              ) : null}
            </div>
          </Link>

          <div className="grid gap-6">
            {campaignCards.slice(1).map((card) => (
              <Link
                key={`small-${card.to}`}
                to={card.to}
                className="group relative min-h-[230px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-950 shadow-sm transition hover:-translate-y-1"
              >
                <img src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="relative flex min-h-[230px] flex-col justify-end p-6 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-2xl leading-tight">{card.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {isSectionEnabled('newIn') ? (
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {sections.newIn.eyebrow}
            </p>
            <h2 className={sectionTitleClass}>{sections.newIn.title}</h2>
          </div>
          {sections.newIn.ctaLabel && sections.newIn.ctaTo ? (
            <Link to={sections.newIn.ctaTo} className="text-sm font-semibold text-slate-700">
              {sections.newIn.ctaLabel}
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">
            {getUiText(locale, 'loadingProducts')}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {newInProducts.map((product) => (
              <ProductCard key={product.id} product={product} eyebrow={sections.newIn.eyebrow} />
            ))}
          </div>
        )}
      </section>
      ) : null}

      {isSectionEnabled('bestsellers') ? (
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {sections.bestsellers.eyebrow}
            </p>
            <h2 className={sectionTitleClass}>{sections.bestsellers.title}</h2>
          </div>
          {sections.bestsellers.ctaLabel && sections.bestsellers.ctaTo ? (
            <Link to={sections.bestsellers.ctaTo} className="text-sm font-semibold text-slate-700">
              {sections.bestsellers.ctaLabel}
            </Link>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">
            {getUiText(locale, 'loadingProducts')}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {bestsellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} eyebrow={sections.bestsellers.eyebrow} />
            ))}
          </div>
        )}
      </section>
      ) : null}

      {isSectionEnabled('categories') ? (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            {sections.categories.eyebrow}
          </p>
          <h2 className={sectionTitleClass}>{sections.categories.title}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {categoryCards.map((collection) => {
            const localizedCollection = localizeEntity(collection, locale);
            const collectionImage = getCollectionImage(collection);
            return (
            <Link
              key={collection.slug}
              to={`/collections/${collection.slug}`}
              className="group relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-950 shadow-sm transition hover:-translate-y-1"
            >
              <img src={collectionImage} alt={localizedCollection.title} className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="relative flex min-h-[320px] flex-col justify-end p-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                  {getUiText(locale, 'collectionFallback')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight">{localizedCollection.title}</h3>
              </div>
            </Link>
            );
          })}
        </div>
      </section>
      ) : null}

      {isSectionEnabled('occasions') ? (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            {sections.occasions.eyebrow}
          </p>
          <h2 className={sectionTitleClass}>{sections.occasions.title}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {collectionCards.slice(0, 3).map((occasion) => (
            <Link
              key={occasion.to}
              to={occasion.to}
              className="group overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-sm transition hover:-translate-y-1"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={occasion.image}
                  alt={occasion.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-3xl font-semibold leading-tight">{occasion.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      ) : null}

      {isSectionEnabled('reviews') ? (
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            {sections.reviews.eyebrow}
          </p>
          <h2 className={sectionTitleClass}>{sections.reviews.title}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {homePageContent.reviews.map((review) => (
            <article key={review.name} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-amber-500">{'★'.repeat(review.rating)}</p>
              <p className="mt-4 text-base leading-8 text-slate-700">“{getExcerpt(review.quote, 88)}”</p>
              <p className="mt-6 font-semibold text-slate-950">{review.name}</p>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      <section className={`grid gap-6 ${isSectionEnabled('ugc') ? 'lg:grid-cols-[0.95fr_1.05fr]' : ''}`}>
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,#f4e8c7,#b8d89f_56%,#c97968)] p-8 text-slate-950 shadow-[0_30px_70px_rgba(166,99,91,0.13)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
            {homePageContent.newsletter.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-4xl leading-tight">{homePageContent.newsletter.title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">
            {homePageContent.newsletter.description}
          </p>

          <form className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email nhận bản tin
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Nhập email của bạn"
              className="w-full rounded-full border border-white/80 bg-white/95 px-5 py-3 text-sm text-slate-900 outline-none"
            />
            <button
              type="button"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Đăng ký nhận tin
            </button>
          </form>
        </div>

        {isSectionEnabled('ugc') ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                {sections.ugc.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-slate-950">{sections.ugc.title}</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {homePageContent.ugcPosts.map((post) => (
              <article key={`${post.platform}-${post.handle}`} className="relative overflow-hidden rounded-[1.5rem] bg-slate-50">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={post.image} alt={`${post.platform} - ${post.handle}`} className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/74 to-transparent p-4 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                    {post.platform}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{post.handle}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        ) : null}
      </section>
    </div>
  );
}
