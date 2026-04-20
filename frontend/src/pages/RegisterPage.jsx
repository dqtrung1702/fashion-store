import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get('next') || '',
    [location.search]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(user?.is_admin ? '/admin' : '/account', { replace: true });
  }, [isAuthenticated, navigate, user?.is_admin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      navigate(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login', {
        state: { message: 'Đăng ký thành công. Vui lòng đăng nhập.' },
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white/85 p-8 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Tài khoản</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-slate-950">Tạo tài khoản</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Lưu đơn hàng, giúp bước thanh toán mượt hơn và giữ cho hành trình mua sắm được kết nối xuyên suốt.
        </p>

        {error && (
          <div className="mb-4 mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="register-full-name" className="block text-sm font-semibold mb-2">
              Họ và tên
            </label>
            <input
              id="register-full-name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold mb-2">Email</label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="register-username" className="block text-sm font-semibold mb-2">Tên đăng nhập</label>
            <input
              id="register-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
              minLength="8"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mật khẩu phải có ít nhất 8 ký tự
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-950 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? 'Đang tải...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link
            to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
            className="font-semibold text-slate-950"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
