import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import useCatalog from '../hooks/useCatalog';
import { localizeEntity } from '../i18n/entities';
import useCartStore from '../store/cartStore';
import useLanguageStore from '../store/languageStore';
import {
  findFirstAvailableVariant,
  findVariant,
  matchesCollection,
  titleize,
} from '../lib/catalog';

const priceOptions = [
  { value: 'all', label: 'Mọi mức giá' },
  { value: 'under-600000', label: 'Dưới 600 nghìn' },
  { value: '600000-800000', label: '600 - 800 nghìn' },
  { value: '800000-1000000', label: '800 nghìn - 1 triệu' },
  { value: 'over-1000000', label: 'Trên 1 triệu' },
];

const availabilityOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'in-stock', label: 'Còn hàng' },
  { value: 'low-stock', label: 'Sắp hết hàng' },
];

const sortOptions = [
  { value: 'new', label: 'Mới nhất' },
  { value: 'best-selling', label: 'Bán chạy' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: 'trending', label: 'Xu hướng' },
];

const matchesPriceRange = (product, range) => {
  if (range === 'all') return true;
  if (range === 'under-600000') return product.price < 600000;
  if (range === '600000-800000') return product.price >= 600000 && product.price <= 800000;
  if (range === '800000-1000000') return product.price > 800000 && product.price <= 1000000;
  if (range === 'over-1000000') return product.price > 1000000;
  return true;
};

const matchesAvailability = (product, availability) => {
  if (availability === 'all') return true;
  if (availability === 'in-stock') return product.stock > 0;
  if (availability === 'low-stock') return product.stock > 0 && product.stock <= 8;
  return true;
};

const getProductImage = (product = {}) => product.coverImage || product.images?.[0] || '';

export default function CollectionPage() {
  const { slug } = useParams();
  const { products, collections, loading, error } = useCatalog();
  const locale = useLanguageStore((state) => state.locale);
  const collection = collections.find((entry) => entry.slug === slug) || null;
  const localizedCollection = localizeEntity(collection, locale);
  const addItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('new');
  const [feedback, setFeedback] = useState('');

  const pageTitle = localizedCollection?.title || collection?.title || titleize(slug);
  const collectionProducts = collection
    ? products.filter((product) => matchesCollection(product, collection))
    : products;
  const heroImage = getProductImage(collectionProducts[0]);

  const sizeOptions = useMemo(
    () => [...new Set(collectionProducts.flatMap((product) => product.sizes || []))],
    [collectionProducts]
  );
  const colorOptions = useMemo(
    () => [...new Set(collectionProducts.flatMap((product) => product.colors || []))],
    [collectionProducts]
  );
  const styleOptions = useMemo(
    () => [...new Set(collectionProducts.flatMap((product) => product.styleTags || []))],
    [collectionProducts]
  );

  const filteredProducts = useMemo(() => {
    const nextProducts = collectionProducts.filter((product) => {
      const sizeMatch = selectedSize === 'all' || product.sizes?.includes(selectedSize);
      const colorMatch = selectedColor === 'all' || product.colors?.includes(selectedColor);
      const styleMatch = selectedStyle === 'all' || product.styleTags?.includes(selectedStyle);
      const priceMatch = matchesPriceRange(product, selectedPrice);
      const availabilityMatch = matchesAvailability(product, selectedAvailability);

      return sizeMatch && colorMatch && styleMatch && priceMatch && availabilityMatch;
    });

    return [...nextProducts].sort((a, b) => {
      if (sortBy === 'best-selling') return Number(b.isBestSeller) - Number(a.isBestSeller) || b.stock - a.stock;
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'trending') return b.trendingScore - a.trendingScore;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [
    collectionProducts,
    selectedAvailability,
    selectedColor,
    selectedPrice,
    selectedSize,
    selectedStyle,
    sortBy,
  ]);

  const handleQuickAdd = async (product, forcedSize, forcedColor) => {
    const selectedVariant =
      findVariant(product, { size: forcedSize, color: forcedColor }) || findFirstAvailableVariant(product);

    if (!selectedVariant) {
      setFeedback(`"${product.name}" hiện chưa có biến thể khả dụng.`);
      window.setTimeout(() => setFeedback(''), 2200);
      return;
    }

    const availableStock = Number(selectedVariant.stock ?? product.stock ?? 0);
    if (availableStock <= 0) {
      setFeedback(`"${product.name}" hiện đã hết hàng.`);
      window.setTimeout(() => setFeedback(''), 2200);
      return;
    }

    try {
      await addItem({
        product_id: product.id,
        variant_id: selectedVariant.id,
        variant_sku: selectedVariant.sku,
        quantity: 1,
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.price ?? product.price,
        product_name: product.name,
        image: product.coverImage || product.images?.[0] || '',
        category: product.category,
        max_quantity: availableStock,
        available: true,
      });

      setFeedback(`Đã thêm nhanh “${product.name}” vào giỏ.`);
      window.setTimeout(() => setFeedback(''), 2200);
    } catch (error) {
      setFeedback(error?.response?.data?.detail || error?.message || `Không thể thêm “${product.name}” vào giỏ.`);
      window.setTimeout(() => setFeedback(''), 2200);
    }
  };

  const resetFilters = () => {
    setSelectedSize('all');
    setSelectedColor('all');
    setSelectedPrice('all');
    setSelectedStyle('all');
    setSelectedAvailability('all');
    setSortBy('new');
  };

  if (!loading && slug && !collection) {
    return (
      <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">
        Không tìm thấy danh mục này hoặc danh mục đang bị ẩn.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Bộ sưu tập"
        title={pageTitle}
        image={heroImage}
        description={
          localizedCollection?.description ||
          collection?.description ||
          'Một bản chọn lọc được dựng từ catalog hiện có. Khi định hướng thương hiệu rõ hơn, các trang bộ sưu tập này sẽ còn sắc nét và cụ thể hơn nữa.'
        }
      >
        <p className={`max-w-2xl text-sm uppercase tracking-[0.22em] ${heroImage ? 'text-white/75' : 'text-slate-500'}`}>
          {`${filteredProducts.length} sản phẩm trong danh mục ${pageTitle}`}
        </p>
      </PageHero>

      {feedback ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl bg-white/80 px-6 py-16 text-center text-slate-600 shadow-sm">Đang tải bộ sưu tập...</div>
      ) : filteredProducts.length > 0 ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
            <aside className="h-fit rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Bộ lọc</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Tinh chỉnh danh sách</h2>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-slate-700"
                >
                  Xóa lọc
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="collection-filter-size" className="mb-2 block text-sm font-semibold text-slate-700">Size</label>
                  <select
                    id="collection-filter-size"
                    value={selectedSize}
                    onChange={(event) => setSelectedSize(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="all">Tất cả size</option>
                    {sizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="collection-filter-color" className="mb-2 block text-sm font-semibold text-slate-700">Màu sắc</label>
                  <select
                    id="collection-filter-color"
                    value={selectedColor}
                    onChange={(event) => setSelectedColor(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="all">Tất cả màu</option>
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="collection-filter-price" className="mb-2 block text-sm font-semibold text-slate-700">Mức giá</label>
                  <select
                    id="collection-filter-price"
                    value={selectedPrice}
                    onChange={(event) => setSelectedPrice(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    {priceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="collection-filter-style" className="mb-2 block text-sm font-semibold text-slate-700">Phong cách</label>
                  <select
                    id="collection-filter-style"
                    value={selectedStyle}
                    onChange={(event) => setSelectedStyle(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="all">Tất cả phong cách</option>
                    {styleOptions.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="collection-filter-availability" className="mb-2 block text-sm font-semibold text-slate-700">Tình trạng hàng</label>
                  <select
                    id="collection-filter-availability"
                    value={selectedAvailability}
                    onChange={(event) => setSelectedAvailability(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Hiển thị {filteredProducts.length} sản phẩm</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{pageTitle}</p>
                </div>

                <div className="flex items-center gap-3">
                  <label htmlFor="collection-sort" className="text-sm font-semibold text-slate-700">Sắp xếp</label>
                  <select
                    id="collection-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-full border border-slate-300 px-4 py-3 text-sm"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eyebrow={pageTitle}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Nội dung SEO</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-slate-950">
              {localizedCollection?.seoHeading || collection?.seoHeading || `${pageTitle} cho tủ đồ hiện đại`}
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-600">
              {localizedCollection?.seoBody ||
                collection?.seoBody ||
                `${pageTitle} trong storefront này được chọn theo tiêu chí dễ mặc, dễ phối và có tinh thần thời trang rõ ràng. Đây là phần mô tả cuối trang để hỗ trợ cả trải nghiệm nội dung lẫn SEO khi triển khai đầy đủ về sau.`}
            </p>
          </section>
        </>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-8 py-16 text-center">
          <h2 className="font-display text-3xl leading-tight text-slate-950">Chưa có sản phẩm phù hợp với bộ lọc hiện tại.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Hãy nới bộ lọc hoặc quay lại nhóm hàng mới về để tiếp tục khám phá.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
            >
              Xóa bộ lọc
            </button>
            <Link
              to="/new-in"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Xem hàng mới về
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
