import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import { formatCurrency } from '../lib/catalog';
import { ordersService } from '../services';
import useAuthStore from '../store/authStore';
import useContentStore from '../store/contentStore';

const formatPaymentMethod = (paymentMethod, storeHoldDurationLabel) =>
  paymentMethod === 'online_followup'
    ? 'Nhận thông tin thanh toán online từ cửa hàng'
    : paymentMethod === 'store_visit_hold'
    ? `Giữ hàng ${storeHoldDurationLabel}, thanh toán tại cửa hàng`
    : paymentMethod;

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const siteChrome = useContentStore((state) => state.siteChrome);
  const storeHoldDurationLabel = siteChrome?.storeHoldDurationLabel || '24h';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestOrderNumber = searchParams.get('placed');

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        if (isAuthenticated) {
          const { data } = await ordersService.getAll();
          if (!ignore) setOrders(data || []);
          return;
        }

        if (latestOrderNumber) {
          const { data } = await ordersService.track(latestOrderNumber);
          if (!ignore) setOrders(data ? [data] : []);
          return;
        }

        if (!ignore) setOrders([]);
      } catch (loadError) {
        if (!ignore) {
          setOrders([]);
          setError(loadError?.response?.data?.detail || 'Không thể tải đơn hàng');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, latestOrderNumber]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

    try {
      const { data } = await ordersService.cancel(orderId);
      setOrders((current) => current.map((order) => (order.id === orderId ? data : order)));
    } catch (cancelError) {
      setError(cancelError?.response?.data?.detail || 'Không thể hủy đơn hàng');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Đơn hàng"
          title="Đang tải đơn hàng"
          description="Hệ thống đang lấy dữ liệu đơn hàng từ backend."
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Đơn hàng"
          title="Bạn chưa có đơn hàng nào"
          description={
            isAuthenticated
              ? 'Các đơn đã đặt trên tài khoản này sẽ xuất hiện tại đây.'
              : 'Nếu vừa checkout với tư cách khách, bạn sẽ được chuyển sang trang theo dõi đơn để tra cứu bằng mã đơn.'
          }
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
        eyebrow="Đơn hàng"
        title="Lịch sử đơn hàng"
        description="Đơn hàng giờ được lấy trực tiếp từ backend. Nếu bạn đã đăng nhập, đây là lịch sử theo tài khoản; nếu không, trang này chỉ hiển thị đơn vừa đặt khi có mã đơn."
      />

      {latestOrderNumber ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          Đơn <span className="font-semibold">{latestOrderNumber}</span> đã được tạo thành công. Cửa hàng sẽ liên hệ lại để gửi thông tin thanh toán.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-[1.75rem] bg-white/85 p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Đơn hàng</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">{order.orderNumber}</h2>
                <p className="mt-2 text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  order.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : order.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : order.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {order.status === 'cancelled'
                  ? 'Đã hủy'
                  : order.status === 'confirmed'
                  ? 'Đã xác nhận'
                  : order.status === 'pending'
                  ? 'Chờ xác nhận thanh toán'
                  : order.status}
              </span>
            </div>

            <div className="mb-5 grid gap-3 border-b border-slate-200 pb-5">
              {order.items.map((item, idx) => (
                <div key={`${item.product_id}-${idx}`} className="flex justify-between gap-4 text-sm text-slate-700">
                  <span>{item.product_name} x {item.quantity} ({item.size})</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Giao hàng</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{order.shipping_address}</p>
                {order.contact_phone ? <p className="mt-2 text-sm text-slate-500">Điện thoại: {order.contact_phone}</p> : null}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Thanh toán</p>
                <p className="mt-3 text-sm leading-6 capitalize text-slate-600">{formatPaymentMethod(order.payment_method, storeHoldDurationLabel)}</p>
                <p className="mt-2 text-sm text-slate-500">{order.email}</p>
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              {(order.trackingSteps || []).map((step) => (
                <div key={step.label} className={`rounded-2xl border px-4 py-4 ${step.active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
                  <p className="font-semibold">{step.label}</p>
                  <p className={`mt-2 text-sm leading-6 ${step.active ? 'text-slate-200' : 'text-slate-500'}`}>{step.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <span className="text-lg font-semibold text-slate-950">Tổng cộng: {formatCurrency(order.total_amount)}</span>
              {isAuthenticated && (order.status === 'confirmed' || order.status === 'pending') ? (
                <button
                  type="button"
                  onClick={() => handleCancelOrder(order.id)}
                  className="text-sm font-semibold text-red-600"
                >
                  Hủy đơn hàng
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
