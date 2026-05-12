import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const productCollectionLabels = useMemo(
    () => [...new Set(getProductCollectionSlugs(product).map((slug) => slug.replace(/-/g, ' ')).filter(Boolean))],
    [product]
  );
  const detailCopy = useMemo(
    () =>
      locale === 'en'
        ? {
            added: 'Added to cart',
            cart: 'View cart',
            category: 'Category',
            color: 'Color',
            craftedFor: 'Best for',
            fitNotes: 'Fit notes',
            inStock: 'ready in stock',
            material: 'Material',
            noProduct: 'Product not found',
            outOfStock: 'Out of stock',
            qty: 'Quantity',
            readyToShip: 'Ready-to-order detail',
            related: 'You may also like',
            relatedTitle: `More from ${localizedProduct.category}`,
            returns: '14-day size exchange',
            save: hasWishlisted ? 'Saved' : 'Save item',
            shipping: 'Delivery policy',
            shop: siteChrome.brandName,
            size: 'Size',
            sizeGuide: 'Open size guide',
            sku: 'SKU',
            stockLow: 'Low stock',
            styleTags: 'Style',
            subtitle:
              localizedProduct.seoDescription || 'A more editorial product layout with quick choices, trust cues and a stronger purchase panel.',
            trust1: 'Ships with clear size and color confirmation',
            trust2: 'Useful for Tet, events, school and group orders',
            trust3: 'Real stock is synced from the product variants',
            variation: 'Choose your version',
            viewPolicy: 'View policy',
          }
        : {
            added: 'Đã thêm vào giỏ',
            cart: 'Xem giỏ hàng',
            category: 'Danh mục',
            color: 'Màu sắc',
            craftedFor: 'Phù hợp với',
            fitNotes: 'Lưu ý phom dáng',
            inStock: 'bộ có sẵn',
            material: 'Chất liệu',
            noProduct: 'Không tìm thấy sản phẩm',
            outOfStock: 'Hết hàng',
            qty: 'Số lượng',
            readyToShip: 'Mẫu sẵn có thể chốt nhanh',
            related: 'Gợi ý liên quan',
            relatedTitle: `Thêm sản phẩm từ nhóm ${localizedProduct.category}`,
            returns: 'Đổi size trong 14 ngày',
            save: hasWishlisted ? 'Đã lưu' : 'Lưu sản phẩm',
            shipping: 'Chính sách giao hàng',
            shop: siteChrome.brandName,
            size: 'Kích cỡ',
            sizeGuide: 'Mở hướng dẫn size',
            sku: 'SKU',
            stockLow: 'Sắp hết',
            styleTags: 'Phong cách',
            subtitle:
              localizedProduct.seoDescription || 'Bố cục ưu tiên ảnh lớn, lựa chọn nhanh và tín hiệu tin cậy ngay cạnh nút mua.',
            trust1: 'Chốt size và màu rõ ràng trước khi lên đơn',
            trust2: 'Hợp cho Tết, sự kiện, trường lớp và đơn nhóm',
            trust3: 'Tồn kho thực tế đang đồng bộ theo từng biến thể',
            variation: 'Chọn phiên bản phù hợp',
            viewPolicy: 'Xem chính sách',
          },
    [hasWishlisted, locale, localizedProduct.category, localizedProduct.seoDescription, siteChrome.brandName]
  );
  const availableStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);
  const stockTone =
    availableStock <= 0 ? 'bg-rose-100 text-rose-700' : availableStock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  const trustPoints = [detailCopy.trust1, detailCopy.trust2, detailCopy.trust3];

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
    return <div className="rounded-[2rem] bg-white/80 px-8 py-16 text-center text-slate-600 shadow-sm">{detailCopy.noProduct}</div>;
  }

  return (
    <div className="space-y-10">
      <section className="rounded-[2.4rem] border border-white/60 bg-white/82 p-5 shadow-[0_24px_80px_rgba(166,99,91,0.1)] md:p-7">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <span>{localizedProduct.category}</span>
              {productCollectionLabels.slice(0, 2).map((label) => (
                <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
                  {label}
                </span>
              ))}
              {badges.map((badge) => (
                <span key={badge} className="rounded-full bg-[#f4ddda] px-3 py-1 text-[11px] text-[#8f514a]">
                  {badge}
                </span>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[92px_minmax(0,1fr)]">
              <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    aria-label={`Xem ảnh ${idx + 1} của ${localizedProduct.name}`}
                    aria-pressed={(selectedImage || galleryImages[0]) === img}
                    className={`aspect-[4/5] w-[78px] shrink-0 overflow-hidden rounded-[1.35rem] border bg-slate-100 transition lg:w-full ${
                      (selectedImage || galleryImages[0]) === img
                        ? 'border-[#c97968] ring-2 ring-[#c97968]/15'
                        : 'border-white/50 hover:border-[#d8b9ad]'
                    }`}
                  >
                    <img src={img} alt={`${localizedProduct.name} - anh ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="order-1 overflow-hidden rounded-[2.2rem] border border-white/70 bg-[#f7efe9] shadow-[0_22px_60px_rgba(166,99,91,0.09)] lg:order-2">
                <div className="aspect-[4/5]">
                  {selectedImage || galleryImages[0] ? (
                    <img src={selectedImage || galleryImages[0]} alt={localizedProduct.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {trustPoints.map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-white/70 bg-[rgba(255,255,255,0.72)] px-4 py-4">
                  <span className="mb-3 block h-0.5 w-10 bg-[#c97968]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-[rgba(255,255,255,0.72)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{detailCopy.readyToShip}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{localizedProduct.name}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{localizedProduct.description}</p>
            </div>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[2.2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,244,239,0.92))] p-6 shadow-[0_28px_90px_rgba(166,99,91,0.14)] md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{detailCopy.shop}</p>
                  <h1 className="mt-3 font-display text-4xl leading-tight text-slate-950">{localizedProduct.name}</h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{detailCopy.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="rounded-full border border-slate-300 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  {detailCopy.save}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-4xl font-semibold text-slate-950">{formatCurrency(selectedVariant?.price ?? product.price)}</p>
                  {product.compareAtPrice ? (
                    <p className="mt-2 text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
                  ) : null}
                </div>
                <div className="space-y-2 text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${stockTone}`}>
                    {availableStock <= 0
                      ? detailCopy.outOfStock
                      : availableStock <= 5
                      ? `${detailCopy.stockLow}: ${availableStock}`
                      : `${availableStock} ${detailCopy.inStock}`}
                  </span>
                  <p className="text-sm text-slate-500">{selectedVariant?.sku || product.sku || 'Đang cập nhật'}</p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{detailCopy.variation}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {detailCopy.category}: <span className="font-semibold text-slate-950">{localizedProduct.category}</span>
                      </p>
                    </div>
                    <Link to="/size-guide" className="text-sm font-semibold text-slate-950">
                      {detailCopy.sizeGuide}
                    </Link>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-800">{detailCopy.size}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {sizeOptions.map((size) => {
                        const isAvailable = availableSizes.includes(size);
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              const nextColors = getAvailableColors(product, size);
                              setSelectedSize(size);
                              setSelectedColor((current) => (nextColors.includes(current) ? current : nextColors[0] || ''));
                            }}
                            className={`min-w-[64px] rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              isSelected
                                ? 'border-[#c97968] bg-[#c97968] text-white'
                                : isAvailable
                                ? 'border-slate-300 bg-white text-slate-800 hover:border-[#c97968] hover:text-[#8f514a]'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {product.colors?.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-slate-800">{detailCopy.color}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {colorOptions.map((color) => {
                          const isAvailable = isVariantAvailable(product, {
                            size: selectedSize || initialVariant?.size,
                            color,
                          });
                          const isSelected = selectedColor === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setSelectedColor(color)}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                isSelected
                                  ? 'border-[#c97968] bg-[#c97968] text-white'
                                  : isAvailable
                                  ? 'border-slate-300 bg-white text-slate-800 hover:border-[#c97968] hover:text-[#8f514a]'
                                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                              }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-800">{detailCopy.qty}</p>
                    <div className="flex items-center rounded-full border border-slate-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="px-4 py-2 text-lg font-semibold text-slate-700"
                      >
                        -
                      </button>
                      <span className="min-w-[52px] text-center text-sm font-semibold text-slate-950">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.min(current + 1, Math.max(1, availableStock || 1)))}
                        className="px-4 py-2 text-lg font-semibold text-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={availableStock === 0}
                      className={`rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
                        availableStock === 0 ? 'cursor-not-allowed bg-slate-300' : 'bg-slate-950 hover:bg-slate-800'
                      }`}
                    >
                      {availableStock === 0 ? detailCopy.outOfStock : locale === 'en' ? 'Add to cart' : 'Thêm vào giỏ'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className="rounded-full border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                    >
                      {detailCopy.save}
                    </button>
                  </div>

                  {message ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {message}. <Link to="/cart" className="font-semibold text-emerald-800">{detailCopy.cart}</Link>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{detailCopy.shipping}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{detailCopy.trust1}</p>
                    <Link to="/delivery" className="mt-4 inline-flex text-sm font-semibold text-slate-950">
                      {detailCopy.viewPolicy}
                    </Link>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Returns</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{detailCopy.returns}</p>
                    <Link to="/returns" className="mt-4 inline-flex text-sm font-semibold text-slate-950">
                      {detailCopy.viewPolicy}
                    </Link>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(244,232,199,0.38),rgba(255,255,255,0.84))] p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{detailCopy.fitNotes}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {localizedProduct.fitNotes || (locale === 'en' ? 'Designed for practical repeat wear and easier size planning.' : 'Thiết kế theo hướng dễ mặc và dễ chốt size hơn cho nhu cầu thực tế.')}
                      </p>
                    </div>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span>{detailCopy.material}</span>
                        <span className="text-right font-semibold text-slate-950">{localizedProduct.material || 'Đang cập nhật'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>{detailCopy.sku}</span>
                        <span className="text-right font-semibold text-slate-950">{selectedVariant?.sku || product.sku || 'Đang cập nhật'}</span>
                      </div>
                      {product.styleTags?.length > 0 ? (
                        <div className="flex justify-between gap-3">
                          <span>{detailCopy.styleTags}</span>
                          <span className="text-right font-semibold text-slate-950">{product.styleTags.join(', ')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{detailCopy.related}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-slate-950">
              {detailCopy.relatedTitle}
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
