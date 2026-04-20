import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const successMessage = location.state?.message || '';
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get('next') || '',
    [location.search]
  );
  const reason = useMemo(
    () => new URLSearchParams(location.search).get('reason') || '',
    [location.search]
  );
  const noticeMessage =
    successMessage ||
    (reason === 'session-expired'
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : '');

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(nextPath || (user?.is_admin ? '/admin' : '/account'), { replace: true });
  }, [isAuthenticated, navigate, nextPath, user?.is_admin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.login(username, password);
      setToken(data.access_token);
      setUser(data.user);
      navigate(nextPath || (data.user?.is_admin ? '/admin' : '/account'), { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white/85 p-8 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Tài khoản</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-slate-950">Đăng nhập</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Truy cập đơn hàng, danh sách yêu thích và phần thanh toán từ một khu vực tài khoản duy nhất.
        </p>

        {noticeMessage && (
          <div className="mb-4 mt-6 rounded-2xl bg-emerald-100 p-4 text-emerald-700">
            {noticeMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 mt-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-semibold mb-2">
              Email hoặc tên đăng nhập
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-950 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? 'Đang tải...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link
            to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'}
            className="font-semibold text-slate-950"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
