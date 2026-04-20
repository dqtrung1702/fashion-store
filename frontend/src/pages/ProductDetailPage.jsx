import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import { localizeEntity } from '../i18n/entities';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useCatalog from '../hooks/useCatalog';
import useContentStore from '../store/contentStore';
import useLanguageStore from '../store/languageStore';
import {
  findFirstAvailableVariant,
  findVariant,
  formatCurrency,
  getAvailableColors,
  getAvailableSizes,
  getProductCollectionSlugs,
  getProductBadges,
  getVariantColors,
  getVariantSizes,
  isVariantAvailable,
} from '../lib/catalog';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const { products, loading } = useCatalog();
  const locale = useLanguageStore((state) => state.locale);
  const siteChrome = useContentStore((state) => state.siteChrome);
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const hasWishlisted = useWishlistStore((state) => state.hasItem(id));
  const product = useMemo(
    () => products.find((entry) => entry.id === id) || null,
    [id, products]
  );
  const localizedProduct = useMemo(() => localizeEntity(product, locale), [locale, product]);
  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter((entry) => {
        if (entry.id === id) return false;
        const productCollectionSlugs = getProductCollectionSlugs(product);
        const entryCollectionSlugs = getProductCollectionSlugs(entry);
        return (
          entryCollectionSlugs.some((slug) => productCollectionSlugs.includes(slug)) ||
          entry.category === product.category
        );
      })
      .slice(0, 3);
  }, [id, product, products]);
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = [product.coverImage, ...(product.images || [])].filter(Boolean);
    return [...new Set(images)];
  }, [product]);
  const badges = useMemo(() => getProductBadges(product, locale), [locale, product]);
  const initialVariant = useMemo(() => findFirstAvailableVariant(product), [product]);
  const sizeOptions = useMemo(() => getVariantSizes(product), [product]);
  const availableSizes = useMemo(() => getAvailableSizes(product), [product]);
  const colorOptions = useMemo(
    () => getVariantColors(product, selectedSize || initialVariant?.size),
    [initialVariant?.size, product, selectedSize]
  );
  const availableColors = useMemo(
    () => getAvailableColors(product, selectedSize || initialVariant?.size),
    [initialVariant?.size, product, selectedSize]
  );
  const selectedVariant = useMemo(
    () =>
      findVariant(product, {
        size: selectedSize || initialVariant?.size,
        color: selectedColor || initialVariant?.color,
      }) || initialVariant,
    [initialVariant, product, selectedColor, selectedSize]
  );

  useEffect(() => {
    if (!product) return;
    if (initialVariant?.size) setSelectedSize(initialVariant.size);
    if (initialVariant?.color) setSelectedColor(initialVariant.color);
    setSelectedImage(galleryImages[0] || '');
    setQuantity(1);
    setMessage('');
  }, [galleryImages, initialVariant, product]);

  useEffect(() => {
    const maxQuantity = Math.max(1, selectedVariant?.stock || product?.stock || 1);
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [product?.stock, selectedVariant?.stock]);

  useEffect(() => {
    if (!product) return undefined;

    const previousTitle = document.title;
    const nextTitle = localizedProduct.seoTitle || `${localizedProduct.name} | ${siteChrome.brandName}`;
    document.title = nextTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute('content') || '';
    if (metaDescription) {
      metaDescription.setAttribute('content', localizedProduct.seoDescription || localizedProduct.description || '');
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [localizedProduct, product, siteChrome.brandName]);

  const handleAddToCart = async () => {
    if (!product) return;
    const availableStock = Number(selectedVariant?.stock ?? product.stock ?? 0);
    if (availableStock <= 0) {
      setMessage('Biến thể này hiện không còn hàng');
      return;
    }
    if (quantity > availableStock) {
      setMessage('Số lượng vượt quá tồn kho hiện có');
      return;
    }

    try {
      const item = {
        product_id: product.id,
        quantity,
        variant_id: selectedVariant?.id,
        variant_sku: selectedVariant?.sku,
        size: selectedVariant?.size || selectedSize,
        color: selectedVariant?.color || selectedColor,
        price: selectedVariant?.price ?? product.price,
        product_name: localizedProduct.name,
        image: product.coverImage || product.images?.[0] || '',
        category: product.category,
        max_quantity: availableStock,
        available: true,
      };
      await addItem(item);
      setMessage('Đã thêm vào giỏ');
    } catch (error) {
      setMessage(error?.response?.data?.detail || error?.message || 'Không thể thêm vào giỏ');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      await toggleWishlist(product);
      setMessage(hasWishlisted ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Không thể cập nhật danh sách yêu thích');
    }
  };

  if (loading) {
    return <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className="space-y-8">
      <PageHero eyebrow={localizedProduct.category} title={localizedProduct.name} description={localizedProduct.description} />

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm">
            {selectedImage || galleryImages[0] ? (
              <img
                src={selectedImage || galleryImages[0]}
                alt={localizedProduct.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Chưa có ảnh
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                aria-label={`Xem ảnh ${idx + 1} của ${localizedProduct.name}`}
                aria-pressed={(selectedImage || galleryImages[0]) === img}
                className={`aspect-square overflow-hidden rounded-2xl border bg-slate-100 transition ${
                  (selectedImage || galleryImages[0]) === img
                    ? 'border-slate-950 ring-2 ring-slate-950/15'
                    : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${localizedProduct.name} - anh ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/85 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{localizedProduct.category}</p>
              <h1 className="mt-3 font-display text-4xl leading-tight text-slate-950">{localizedProduct.name}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              {hasWishlisted ? 'Đã lưu' : 'Lưu'}
            </button>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-3xl font-semibold text-slate-950">{formatCurrency(product.price)}</p>
              {product.compareAtPrice ? (
                <p className="mt-2 text-sm text-slate-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              ) : null}
            </div>
            <p className="max-w-xs text-right text-sm leading-6 text-slate-500">
              {localizedProduct.seoDescription || 'Tỷ lệ hiện đại, hoàn thiện gọn và đủ bền để mặc lặp lại thường xuyên.'}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="product-detail-size" className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Kích cỡ</label>
              <select
                id="product-detail-size"
                value={selectedSize}
                onChange={(e) => {
                  const nextSize = e.target.value;
                  const nextColors = getAvailableColors(product, nextSize);
                  setSelectedSize(nextSize);
                  setSelectedColor((current) => (nextColors.includes(current) ? current : nextColors[0] || ''));
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                {sizeOptions.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  return (
                    <option key={size} value={size} disabled={!isAvailable}>
                      {isAvailable ? size : `${size} - Hết hàng`}
                    </option>
                  );
                })}
              </select>
            </div>

            {product.colors?.length > 0 && (
              <div>
                <label htmlFor="product-detail-color" className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Màu sắc</label>
                <select
                  id="product-detail-color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  {colorOptions.map((color) => {
                    const isAvailable = isVariantAvailable(product, {
                      size: selectedSize || initialVariant?.size,
                      color,
                    });
                    return (
                      <option key={color} value={color} disabled={!isAvailable}>
                        {isAvailable ? color : `${color} - Hết hàng`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="product-detail-quantity" className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Số lượng</label>
              <input
                id="product-detail-quantity"
                type="number"
                min="1"
                max={selectedVariant?.stock || product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      Math.max(1, Number(e.target.value || 1)),
                      Math.max(1, selectedVariant?.stock || product.stock || 1)
                    )
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={(selectedVariant?.stock ?? product.stock) === 0}
              className={`w-full rounded-full py-4 text-sm font-semibold text-white transition ${
                (selectedVariant?.stock ?? product.stock) === 0
                  ? 'cursor-not-allowed bg-slate-300'
                  : 'bg-slate-950 hover:bg-slate-800'
              }`}
            >
              {(selectedVariant?.stock ?? product.stock) === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}. <Link to="/cart" className="font-semibold text-emerald-800">Xem giỏ hàng</Link>
              </div>
            ) : null}

            <div className="grid gap-4 rounded-[1.5rem] bg-slate-50 p-5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>SKU</span>
                <span className="font-semibold text-slate-950">
                  {selectedVariant?.sku || product.sku || 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Giao hàng</span>
                <Link to="/delivery" className="font-semibold text-slate-950">Xem chính sách</Link>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Đổi trả</span>
                <Link to="/returns" className="font-semibold text-slate-950">Đổi trả trong 14 ngày</Link>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Hướng dẫn size</span>
                <Link to="/size-guide" className="font-semibold text-slate-950">Mở hướng dẫn</Link>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lưu ý phom dáng</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{localizedProduct.fitNotes || 'Thiết kế cho nhịp mặc hiện đại mỗi ngày.'}</p>
                <p className="mt-3 text-sm text-slate-500">Chất liệu: {localizedProduct.material || 'Thông tin sẽ sớm được cập nhật.'}</p>
                {product.styleTags?.length > 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Phong cách: {product.styleTags.join(', ')}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Liên quan</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-slate-950">
              Thêm sản phẩm từ nhóm {localizedProduct.category}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((entry) => (
              <ProductCard key={entry.id} product={entry} eyebrow="Có thể bạn cũng thích" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
