import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import { formatCurrency } from '../lib/catalog';
import useCatalog from '../hooks/useCatalog';
import useCartStore from '../store/cartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { products, loading: catalogLoading } = useCatalog();
  const items = useCartStore((state) => state.items);
  const source = useCartStore((state) => state.source);
  const error = useCartStore((state) => state.error);
  const syncNotice = useCartStore((state) => state.syncNotice);
  const [actionError, setActionError] = React.useState('');
  const clearSyncNotice = useCartStore((state) => state.clearSyncNotice);
  const removeItem = useCartStore((state) => state.removeItem);
  const syncAvailability = useCartStore((state) => state.syncAvailability);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const total = useCartStore((state) => state.getTotal());
  const hasUnavailableItems = items.some(
    (item) => item.available === false || (Number(item.max_quantity || 0) > 0 && item.quantity > item.max_quantity)
  );

  React.useEffect(() => {
    if (source !== 'local' || catalogLoading || !products.length) return;
    syncAvailability(products);
  }, [catalogLoading, products, source, syncAvailability]);

  const handleRemoveItem = async (item) => {
    try {
      setActionError('');
      clearSyncNotice();
      await removeItem(item.product_id, item.size, item.color, item.variant_id, item.variant_sku);
    } catch (removalError) {
      setActionError(removalError?.response?.data?.detail || removalError?.message || 'Không thể xóa sản phẩm khỏi giỏ.');
    }
  };

  const handleQuantityChange = async (item, nextQuantity) => {
    try {
      setActionError('');
      clearSyncNotice();
      await updateQuantity(
        item.product_id,
        item.size,
        nextQuantity,
        item.color,
        item.variant_id,
        item.variant_sku
      );
    } catch (quantityError) {
      setActionError(quantityError?.response?.data?.detail || quantityError?.message || 'Không thể cập nhật số lượng.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Giỏ hàng"
          title="Giỏ hàng của bạn đang trống"
          description="Hãy thêm vài món thật ổn, rồi quay lại đây để chốt bản phối cuối cùng."
        >
          <Link to="/new-in" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
            Tiếp tục mua sắm
          </Link>
        </PageHero>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Giỏ hàng"
        title="Giỏ hàng"
        description="Xem lại lựa chọn của bạn, chỉnh số lượng và chuyển sang thanh toán khi mọi thứ đã vừa ý."
      />

      {error || actionError ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error || actionError}
        </div>
      ) : null}

      {syncNotice ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          {syncNotice}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600">
        {source === 'backend'
          ? 'Giỏ hàng đang đồng bộ với tài khoản của bạn trên server.'
          : 'Bạn đang dùng giỏ hàng local ở chế độ guest.'}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.variant_id || `${item.product_id}-${item.size}-${item.color || ''}`} className="grid gap-4 rounded-[1.75rem] bg-white/85 p-5 shadow-sm md:grid-cols-[128px_1fr_auto]">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                  {item.image ? (
                    <img src={item.image} alt={item.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.category || 'Sản phẩm đã chọn'}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{item.product_name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Size: {item.size} {item.color && `| Màu: ${item.color}`}
                  </p>
                  {item.variant_sku ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">SKU: {item.variant_sku}</p>
                  ) : null}
                  <p className="mt-4 text-lg font-semibold text-slate-950">{formatCurrency(item.price)}</p>
                  {!item.available ? (
                    <p className="mt-2 text-sm font-medium text-red-600">Biến thể này hiện không còn hàng.</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-4 md:items-end">
                  <label htmlFor={`cart-quantity-${item.variant_id || item.product_id}`} className="sr-only">
                    So luong cho {item.product_name}
                  </label>
                  <input
                    id={`cart-quantity-${item.variant_id || item.product_id}`}
                    type="number"
                    min="1"
                    max={item.max_quantity || undefined}
                    value={item.quantity}
                    onChange={(event) => handleQuantityChange(item, Number(event.target.value || 1))}
                    className="w-24 rounded-full border border-slate-300 px-4 py-2"
                  />
                  <p className="text-lg font-semibold text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    className="text-sm font-semibold text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white/85 p-6 shadow-sm h-fit">
          <h2 className="text-2xl font-semibold text-slate-950">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 border-b border-slate-200 pb-5">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span>Tính ở bước thanh toán</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thuế và phí dự kiến:</span>
              <span>{formatCurrency(total * 0.08)}</span>
            </div>
          </div>
          <div className="mb-6 mt-5 flex justify-between text-lg font-semibold text-slate-950">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(total * 1.08)}</span>
          </div>
          <button
            type="button"
            disabled={hasUnavailableItems}
            onClick={() => navigate('/checkout')}
            className="mb-3 w-full rounded-full bg-slate-950 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {hasUnavailableItems ? 'Cập nhật lại giỏ hàng trước khi thanh toán' : 'Tiến hành thanh toán'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-full border border-slate-300 py-4 text-sm font-semibold text-slate-700"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
}
