import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/public/PageHero';
import ProductCard from '../components/public/ProductCard';
import useWishlistStore from '../store/wishlistStore';

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const source = useWishlistStore((state) => state.source);
  const error = useWishlistStore((state) => state.error);
  const clear = useWishlistStore((state) => state.clear);
  const [actionError, setActionError] = React.useState('');

  const handleClear = async () => {
    try {
      setActionError('');
      await clear();
    } catch (clearError) {
      setActionError(clearError?.response?.data?.detail || 'Không thể xóa danh sách yêu thích.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Đã lưu"
        title="Danh sách yêu thích"
        description="Lưu lại những món nổi bật trong lúc bạn cân nhắc size, cách phối hoặc thời điểm mua."
      >
        {items.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Xóa danh sách yêu thích
          </button>
        ) : null}
      </PageHero>

      {error || actionError ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error || actionError}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600">
        {source === 'backend'
          ? 'Danh sách yêu thích đang đồng bộ với tài khoản của bạn trên server.'
          : 'Bạn đang dùng danh sách yêu thích local ở chế độ guest.'}
      </div>

      {items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} eyebrow="Đã lưu" />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-8 py-16 text-center">
          <h2 className="font-display text-3xl leading-tight text-slate-950">Bạn chưa lưu sản phẩm nào.</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Hãy lưu sản phẩm ngay từ trang chi tiết để tạo shortlist cho lần quay lại sau.
          </p>
          <Link
            to="/new-in"
            className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Xem hàng mới về
          </Link>
        </div>
      )}
    </div>
  );
}
