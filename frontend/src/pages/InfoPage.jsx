import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import { formatCurrency } from '../lib/catalog';
import { ordersService } from '../services';
import useContentStore from '../store/contentStore';

const getMapQuery = (location = {}) =>
  [location.coordinates, location.address, location.title].find((value) => value?.trim()) || '';

const extractIframeSrc = (value = '') => {
  const match = value.match(/src=["']([^"']+)["']/i);
  return match?.[1] || value;
};

const getGoogleMapsEmbedUrl = (location = {}) => {
  const embedUrl = extractIframeSrc(location.embedUrl?.trim() || '');
  if (embedUrl.includes('google.com/maps/embed')) return embedUrl;

  const query = getMapQuery(location);
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
};

const getGoogleMapsUrl = (location = {}) => {
  const mapUrl = location.mapUrl?.trim() || '';
  if (mapUrl) return mapUrl;

  const query = getMapQuery(location);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
};

export default function InfoPage({ pageKey }) {
  const infoPages = useContentStore((state) => state.infoPages);
  const page = infoPages[pageKey];
  const [searchParams] = useSearchParams();
  const [trackingValues, setTrackingValues] = useState({
    orderNumber: searchParams.get('order') || '',
  });
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [placedMessage, setPlacedMessage] = useState(searchParams.get('placed') === '1');

  useEffect(() => {
    if (pageKey !== 'track-order') return;
    if (!trackingValues.orderNumber.trim()) return;

    const run = async () => {
      try {
        setTrackingLoading(true);
        setTrackingError('');
        const { data } = await ordersService.track(trackingValues.orderNumber.trim());
        setTrackedOrder(data);
      } catch (error) {
        setTrackedOrder(null);
        setTrackingError(error?.response?.data?.detail || 'Không tìm thấy đơn hàng');
      } finally {
        setTrackingLoading(false);
      }
    };

    run();
  }, [pageKey]); // intentional one-shot preload from URL

  if (!page) return null;
  const storeLocation = pageKey === 'contact' ? page.storeLocation || page.mapLocation : null;
  const mapEmbedUrl = storeLocation ? getGoogleMapsEmbedUrl(storeLocation) : '';
  const mapUrl = storeLocation ? getGoogleMapsUrl(storeLocation) : '';

  const handleTrackOrder = async () => {
    if (!trackingValues.orderNumber.trim()) {
      setTrackingError('Vui lòng nhập mã đơn hàng.');
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingError('');
      setPlacedMessage(false);
      const { data } = await ordersService.track(trackingValues.orderNumber.trim());
      setTrackedOrder(data);
    } catch (error) {
      setTrackedOrder(null);
      setTrackingError(error?.response?.data?.detail || 'Không tìm thấy đơn hàng');
    } finally {
      setTrackingLoading(false);
    }
  };

  const softPanelClass = 'rounded-[1.75rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,249,244,0.80),rgba(223,233,228,0.62))] p-6 shadow-sm backdrop-blur-sm';
  const softPanelCompactClass = 'rounded-[1.5rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,249,244,0.80),rgba(242,215,210,0.58))] p-6 shadow-sm backdrop-blur-sm';

  return (
    <div className="space-y-8">
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.intro} image={page.image || ''} />

      {page.sections ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className={softPanelClass}>
              <h2 className="text-2xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      ) : null}

      {page.table ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,249,244,0.80),rgba(223,233,228,0.62))] shadow-sm backdrop-blur-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-950 text-left text-sm text-white">
              <tr>
                {page.table.headers.map((header) => (
                  <th key={header} className="px-6 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {page.table.rows.map((row) => (
                <tr key={row[0]} className="text-sm text-slate-700">
                  {row.map((cell) => (
                    <td key={cell} className="px-6 py-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {page.faqs ? (
        <div className="space-y-4">
          {page.faqs.map((faq) => (
            <div key={faq.question} className={softPanelCompactClass}>
              <h2 className="text-xl font-semibold text-slate-950">{faq.question}</h2>
              <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      ) : null}

      {page.cards ? (
        <div className="grid gap-6 md:grid-cols-3">
          {page.cards.map((card) => (
            <article key={card.title} className={softPanelCompactClass}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{card.title}</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{card.detail}</h2>
              <p className="mt-2 text-sm text-slate-600">{card.note}</p>
            </article>
          ))}
        </div>
      ) : null}

      {storeLocation && mapEmbedUrl ? (
        <section className="grid gap-6 overflow-hidden rounded-[1.75rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,249,244,0.80),rgba(223,233,228,0.62))] p-5 shadow-sm backdrop-blur-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="p-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Bản đồ cửa hàng</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              {storeLocation.title || 'Vị trí cửa hàng'}
            </h2>
            {storeLocation.address ? (
              <p className="mt-4 text-sm leading-7 text-slate-600">{storeLocation.address}</p>
            ) : null}
            {storeLocation.coordinates ? (
              <p className="mt-2 text-sm text-slate-500">Tọa độ: {storeLocation.coordinates}</p>
            ) : null}
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Mở trên Google Maps
              </a>
            ) : null}
          </div>
          <div className="min-h-[320px] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100">
            <iframe
              title={storeLocation.title || 'Google Maps'}
              src={mapEmbedUrl}
              className="h-full min-h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {page.steps ? (
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            className="rounded-[1.75rem] border border-white/65 bg-[linear-gradient(135deg,rgba(255,249,244,0.78),rgba(223,233,228,0.54))] p-6 shadow-sm backdrop-blur-sm"
            onSubmit={(event) => {
              event.preventDefault();
              handleTrackOrder();
            }}
          >
            <h2 className="text-2xl font-semibold text-slate-950">Theo dõi kiện hàng</h2>
            <div className="mt-6 space-y-4">
              <label htmlFor="track-order-number" className="sr-only">
                Mã đơn hàng
              </label>
              <input
                id="track-order-number"
                type="text"
                placeholder="Mã đơn hàng"
                value={trackingValues.orderNumber}
                onChange={(event) =>
                  setTrackingValues((current) => ({ ...current, orderNumber: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
              >
                {trackingLoading ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
              </button>
            </div>
          </form>

          <div className="rounded-[1.75rem] border border-white/65 bg-[linear-gradient(145deg,rgba(223,233,228,0.78),rgba(233,223,220,0.66)_48%,rgba(244,232,199,0.58))] p-6 text-slate-950 shadow-[0_22px_58px_rgba(166,99,91,0.10)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Xem trước</p>
            {placedMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
                Đơn hàng đã được tạo thành công. Nhân viên cửa hàng sẽ liên hệ lại theo thông tin bạn đã điền ở phần giao hàng để gửi hướng dẫn thanh toán. Bạn có thể dùng mã đơn để theo dõi tiến trình xử lý.
              </div>
            ) : null}
            {trackingError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                {trackingError}
              </div>
            ) : null}
            {trackedOrder ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Đã tìm thấy đơn</p>
                  <h3 className="mt-3 text-2xl font-semibold">{trackedOrder.orderNumber}</h3>
                  <p className="mt-2 text-sm text-slate-600">Tổng cộng {formatCurrency(trackedOrder.total_amount)}</p>
                </div>
                {(trackedOrder.trackingSteps || []).map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4 rounded-2xl border border-white/65 bg-white/52 px-4 py-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step.active ? 'bg-slate-950 text-white' : 'bg-white text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{step.label}</p>
                      <p className="text-sm text-slate-600">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {page.steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/16 px-4 py-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${trackingValues.orderNumber.trim() || index === 0 ? 'bg-slate-950 text-white' : 'bg-white text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{step}</p>
                      <p className="text-sm text-slate-600">
                        {trackingValues.orderNumber.trim()
                          ? 'Nhấn kiểm tra trạng thái để truy vấn đơn hàng từ backend.'
                          : 'Nhập mã đơn để xem tiến trình giao hàng.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
