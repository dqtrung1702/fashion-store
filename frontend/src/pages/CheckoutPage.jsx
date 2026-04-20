import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import { findVariant, formatCurrency } from '../lib/catalog';
import { ordersService } from '../services';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useCatalog from '../hooks/useCatalog';
import useContentStore from '../store/contentStore';

const FREE_SHIPPING_THRESHOLD = 2000000;
const STANDARD_SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartSource = useCartStore((state) => state.source);
  const syncNotice = useCartStore((state) => state.syncNotice);
  const syncAvailability = useCartStore((state) => state.syncAvailability);
  const { products } = useCatalog();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const siteChrome = useContentStore((state) => state.siteChrome);
  const storeHoldDurationLabel = siteChrome?.storeHoldDurationLabel || '24h';
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online_followup');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const grandTotal = total + shipping;

  useEffect(() => {
    if (!isAuthenticated) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user?.full_name || '',
      email: current.email || user?.email || '',
    }));
  }, [isAuthenticated, user?.email, user?.full_name]);

  useEffect(() => {
    if (cartSource !== 'local' || !products.length) return;
    syncAvailability(products);
  }, [cartSource, products, syncAvailability]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.country.trim()
    ) {
      setFeedback('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    const hasUnavailableItems = cartItems.some((item) => {
      if (item.available === false) return true;
      if (Number(item.max_quantity || 0) > 0 && item.quantity > item.max_quantity) return true;

      const product =
        products.find((entry) => entry.id === item.product_id) ||
        products.find((entry) => entry.slug === item.product_id);

      if (!product) return false;

      const variant =
        (product.variants || []).find((entry) => entry.id === item.variant_id) ||
        (product.variants || []).find((entry) => entry.sku === item.variant_sku) ||
        findVariant(product, { size: item.size, color: item.color });

      const availableStock = Number((variant || {}).stock ?? product.stock ?? 0);
      return availableStock <= 0 || item.quantity > availableStock;
    });

    if (hasUnavailableItems) {
      setFeedback('Một hoặc nhiều sản phẩm trong giỏ đã hết hàng hoặc không đủ số lượng. Vui lòng quay lại giỏ hàng để cập nhật.');
      return;
    }

    try {
      setProcessing(true);
      setFeedback('');

      const payload = {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          variant_sku: item.variant_sku || null,
          quantity: item.quantity,
        })),
        customer: form,
        payment_method: paymentMethod,
      };

      const { data: order } = await ordersService.create(payload);
      await clearCart();

      if (isAuthenticated) {
        navigate(`/orders?placed=${encodeURIComponent(order.orderNumber)}`);
        return;
      }

      navigate(`/track-order?order=${encodeURIComponent(order.orderNumber)}&placed=1`);
    } catch (error) {
      setFeedback(error?.response?.data?.detail || 'Không thể tạo đơn hàng');
    } finally {
      setProcessing(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Thanh toán"
          title="Chưa có gì để thanh toán"
          description="Giỏ hàng của bạn đang trống. Hãy thêm vài món trước rồi quay lại hoàn tất đơn."
        >
          <Link to="/new-in" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
            Xem hàng mới về
          </Link>
        </PageHero>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Thanh toán"
        title="Hoàn tất đơn hàng"
        description="Trang này hiện mới ghi nhận đơn hàng trên hệ thống. Sau khi gửi đơn, cửa hàng sẽ liên hệ lại theo thông tin giao hàng để hướng dẫn thanh toán."
      />

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2">
          <div className="mb-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4 text-sky-800">
            Đơn hàng sẽ được tạo trên backend nhưng chưa được xem là đã thanh toán. Nhân viên cửa hàng sẽ gửi lại thông tin thanh toán qua email hoặc phương thức liên hệ bạn để lại ở phần giao hàng. {cartSource === 'backend'
              ? 'Giỏ hàng hiện cũng đang đồng bộ từ tài khoản của bạn.'
              : 'Bạn đang checkout ở chế độ guest, nên sau khi gửi đơn hệ thống sẽ chuyển sang trang theo dõi đơn.'}
          </div>

          {feedback ? (
            <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              {feedback}
            </div>
          ) : null}

          {syncNotice ? (
            <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
              {syncNotice}
            </div>
          ) : null}

          <div className="mb-6 rounded-[1.75rem] bg-white/85 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Thông tin giao hàng</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label htmlFor="checkout-full-name" className="sr-only">
                Họ và tên người nhận
              </label>
              <input
                id="checkout-full-name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Họ và tên"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-email" className="sr-only">
                Địa chỉ email
              </label>
              <input
                id="checkout-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Địa chỉ email"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-phone" className="sr-only">
                Số điện thoại
              </label>
              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-country" className="sr-only">
                Quốc gia
              </label>
              <input
                id="checkout-country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Quốc gia"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-city" className="sr-only">
                Tỉnh hoặc thành phố
              </label>
              <input
                id="checkout-city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Tỉnh / Thành phố"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-postal-code" className="sr-only">
                Mã bưu chính
              </label>
              <input
                id="checkout-postal-code"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="Mã bưu chính"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="checkout-address" className="sr-only">
                Địa chỉ đường phố
              </label>
              <input
                id="checkout-address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Địa chỉ đường phố"
                className="rounded-xl border border-slate-300 px-4 py-3 md:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white/85 p-6 shadow-sm">
            <fieldset>
              <legend className="text-2xl font-semibold text-slate-950">Phương thức thanh toán</legend>
              <div className="mt-5 space-y-3">
              <label htmlFor="payment-online-followup" className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <input
                  id="payment-online-followup"
                  type="radio"
                  name="payment-method"
                  value="online_followup"
                  checked={paymentMethod === 'online_followup'}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-slate-950">Đợi nhận thông tin thanh toán online từ cửa hàng</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Sau khi bạn gửi đơn, nhân viên cửa hàng sẽ liên hệ lại qua thông tin bạn đã cung cấp để gửi hướng dẫn thanh toán.
                  </span>
                </span>
              </label>
              <label htmlFor="payment-store-visit-hold" className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                <input
                  id="payment-store-visit-hold"
                  type="radio"
                  name="payment-method"
                  value="store_visit_hold"
                  checked={paymentMethod === 'store_visit_hold'}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-slate-950">{`Đặt giữ hàng trong ${storeHoldDurationLabel} và tới cửa hàng mua trực tiếp`}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {`Cửa hàng sẽ giữ đơn trong ${storeHoldDurationLabel} để bạn tới xem, thử và thanh toán trực tiếp tại cửa hàng.`}
                  </span>
                </span>
              </label>
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="mt-6 w-full rounded-full bg-slate-950 py-4 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {processing ? 'Đang gửi đơn...' : 'Gửi đơn đặt hàng'}
          </button>
        </form>

        <div className="h-fit rounded-[1.75rem] bg-white/85 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Tóm tắt đơn hàng</h2>

          <div className="mb-4 mt-5 space-y-3 border-b border-slate-200 pb-4">
            {cartItems.map((item) => (
              <div key={item.variant_id || `${item.product_id}-${item.size}-${item.color || ''}`} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.product_name} x {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 space-y-2 border-b border-slate-200 pb-4">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-semibold text-slate-950">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
