import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import { authService, ordersService } from '../services';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const cartCount = useCartStore((state) => state.getCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [ordersCount, setOrdersCount] = useState(0);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      if (!isAuthenticated) {
        setOrdersCount(0);
        return;
      }

      try {
        const { data } = await ordersService.getAll();
        if (!ignore) setOrdersCount((data || []).length);
      } catch {
        if (!ignore) setOrdersCount(0);
      }
    };

    loadOrders();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const { data } = await authService.me();
        if (!ignore) {
          setUser(data);
        }
      } catch {
        // Keep existing local auth snapshot if the refresh fails.
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, setUser]);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
    });
  }, [user?.email, user?.full_name]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      setProfileFeedback('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }

    try {
      setProfileLoading(true);
      setProfileFeedback('');
      const { data } = await authService.updateMe({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim().toLowerCase(),
      });
      setUser(data);
      setProfileFeedback('Đã lưu thông tin tài khoản.');
    } catch (error) {
      setProfileFeedback(error?.response?.data?.detail || 'Không thể cập nhật tài khoản.');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Tài khoản"
          title="Khung tài khoản đã sẵn sàng trước khi chốt đăng nhập"
          description="Hãy dùng giai đoạn này để hoàn thiện trải nghiệm tài khoản, danh sách lưu và các điểm chạm đơn hàng trước khi khóa luồng xử lý cuối cùng."
        >
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
              Đăng nhập
            </Link>
            <Link to="/register" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700">
              Tạo tài khoản
            </Link>
          </div>
        </PageHero>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Giỏ hàng</p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">{cartCount}</h2>
            <p className="mt-2 text-sm text-slate-600">Số sản phẩm hiện đang được lưu trong giỏ cục bộ.</p>
          </article>
          <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Yêu thích</p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">{wishlistCount}</h2>
            <p className="mt-2 text-sm text-slate-600">Các sản phẩm đã lưu hiện được giữ cục bộ cho phiên guest.</p>
          </article>
          <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Đơn hàng</p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">0</h2>
            <p className="mt-2 text-sm text-slate-600">Hãy đăng nhập để lưu và xem lịch sử đơn theo tài khoản.</p>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Tài khoản"
        title={`Chào mừng quay lại, ${user?.full_name || user?.username}`}
        description="Khu vực này là trung tâm tài khoản khách hàng. Đơn hàng, cart và wishlist đang được chuyển dần sang backend theo từng bước nhỏ."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm md:col-span-3">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Hồ sơ</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{user?.email}</h2>
              <p className="mt-2 text-sm text-slate-600">Tên đăng nhập: {user?.username}</p>
            </div>
            <form onSubmit={handleSaveProfile} className="grid gap-3 lg:min-w-[360px]">
              <label htmlFor="account-full-name" className="sr-only">
                Họ và tên
              </label>
              <input
                id="account-full-name"
                name="full_name"
                value={profileForm.full_name}
                onChange={handleProfileChange}
                placeholder="Họ và tên"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <label htmlFor="account-email" className="sr-only">
                Email tài khoản
              </label>
              <input
                id="account-email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="Email"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              {profileFeedback ? (
                <p className={`text-sm ${profileFeedback.includes('Đã lưu') ? 'text-emerald-700' : 'text-red-700'}`}>
                  {profileFeedback}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={profileLoading}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {profileLoading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>
          </div>
        </article>
        <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Đơn hàng</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-950">{ordersCount}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Xem lại đơn đã đặt, kiểm tra trạng thái và quay lại các món bạn đã mua gần đây.
          </p>
          <Link to="/orders" className="mt-5 inline-flex text-sm font-semibold text-slate-950">
            Xem đơn hàng
          </Link>
        </article>
        <article className="rounded-[1.5rem] bg-white/85 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Yêu thích</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-950">{wishlistCount}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Lưu lại sản phẩm để cân nhắc sau. Khi đã đăng nhập, wishlist hiện được đồng bộ từ backend theo tài khoản.
          </p>
          <Link to="/wishlist" className="mt-5 inline-flex text-sm font-semibold text-slate-950">
            Xem danh sách yêu thích
          </Link>
        </article>
      </div>
    </div>
  );
}
