export const uiText = {
  vi: {
    admin: 'Admin',
    account: 'Tài khoản',
    addQuick: 'Thêm nhanh',
    all: 'Tất cả',
    cart: 'Giỏ',
    categories: 'Danh mục',
    collectionFallback: 'Danh mục',
    direction: 'Định hướng',
    editorialDirectionBody:
      'Mỗi trang nội dung nên dẫn thẳng về một nhu cầu mua rõ ràng: Tết, hội hè, đồng phục, trường lớp hoặc chụp ảnh nhóm. Khách cần hiểu mẫu nào phù hợp, đặt bao nhiêu bộ và nên chốt size ra sao.',
    editorialDirectionTitle:
      'Kể chuyện gần gũi nhưng vẫn giúp khách chốt catalog nhanh.',
    featuredSuggestions: 'Gợi ý nổi bật',
    language: 'Ngôn ngữ',
    loadingProducts: 'Đang tải sản phẩm...',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    menu: 'Menu',
    noImage: 'Chưa có ảnh',
    noMatchingProducts: 'Chưa có sản phẩm phù hợp cho nhóm này.',
    noPage: 'Không tìm thấy trang nội dung',
    noProductsForEditorial:
      'Chưa có sản phẩm phù hợp. Cần bổ sung catalog để hoàn thiện vòng lặp nội dung và thương mại.',
    shop: 'Mua sắm',
    stories: 'Câu chuyện',
    support: 'Hỗ trợ',
    viewQuick: 'Xem nhanh',
    wishlist: 'Yêu thích',
  },
  en: {
    admin: 'Admin',
    account: 'Account',
    addQuick: 'Quick add',
    all: 'All',
    cart: 'Cart',
    categories: 'Categories',
    collectionFallback: 'Collection',
    direction: 'Direction',
    editorialDirectionBody:
      'Each content page should lead to a clear buying need: Tet, festivals, uniforms, schools or group photos. Customers should quickly understand which style fits, how many pieces to order and how to plan sizes.',
    editorialDirectionTitle:
      'Friendly storytelling that still helps customers choose a catalog quickly.',
    featuredSuggestions: 'Featured picks',
    language: 'Language',
    loadingProducts: 'Loading products...',
    login: 'Sign in',
    logout: 'Sign out',
    menu: 'Menu',
    noImage: 'No image',
    noMatchingProducts: 'No matching products for this group yet.',
    noPage: 'Content page not found',
    noProductsForEditorial:
      'No matching products yet. Add catalog items to complete the content and commerce loop.',
    shop: 'Shop',
    stories: 'Stories',
    support: 'Support',
    viewQuick: 'Quick view',
    wishlist: 'Wishlist',
  },
};

export const badgeText = {
  vi: {
    new: 'Mới',
    sale: 'Giảm giá',
    bestseller: 'Bán chạy',
    lowStock: 'Sắp hết',
  },
  en: {
    new: 'New',
    sale: 'Sale',
    bestseller: 'Bestseller',
    lowStock: 'Low stock',
  },
};

export const getUiText = (locale, key) => uiText[locale]?.[key] || uiText.vi[key] || key;
