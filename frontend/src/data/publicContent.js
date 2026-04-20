const pexelsImage = (id, width = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&q=80`;

export const navigationGroups = {
  shop: [
    { label: 'Mới về', to: '/new-in' },
    { label: 'Bán chạy', to: '/bestsellers' },
    { label: 'Giá tốt', to: '/sale' },
    { label: 'Lễ hội & Tết', to: '/collections/le-hoi-tet' },
    { label: 'Đồng phục tập thể', to: '/collections/dong-phuc-tap-the' },
    { label: 'Trường lớp & sự kiện', to: '/collections/truong-lop-su-kien' },
  ],
  editorial: [
    { label: 'Áo dài hội hè', to: '/campaigns/ao-dai-hoi-he' },
    { label: 'Đặt đồng phục', to: '/lookbook/dong-phuc-tap-the' },
    { label: 'Tết & hội xuân', to: '/occasions/tet-hoi-xuan' },
  ],
  support: [
    { label: 'Về thương hiệu', to: '/about' },
    { label: 'Hướng dẫn size', to: '/size-guide' },
    { label: 'Giao hàng', to: '/delivery' },
    { label: 'Đổi trả', to: '/returns' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Liên hệ', to: '/contact' },
    { label: 'Theo dõi đơn', to: '/track-order' },
  ],
};

export const footerGroups = [
  {
    title: 'Mua sắm',
    links: [
      { label: 'Mới về', to: '/new-in' },
      { label: 'Bán chạy', to: '/bestsellers' },
      { label: 'Giá tốt', to: '/sale' },
      { label: 'Yêu thích', to: '/wishlist' },
      { label: 'Tài khoản', to: '/account' },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { label: 'Áo dài lễ hội & Tết', to: '/collections/le-hoi-tet' },
      { label: 'Áo dài tập thể & đồng phục', to: '/collections/dong-phuc-tap-the' },
      { label: 'Áo dài trường lớp & sự kiện', to: '/collections/truong-lop-su-kien' },
      { label: 'Áo dài chụp ảnh & du lịch', to: '/collections/chup-anh-du-lich' },
      { label: 'Áo dài cơ bản số lượng sẵn', to: '/collections/co-ban-so-luong' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: navigationGroups.support,
  },
];

export const collectionDefinitions = {
  'le-hoi-tet': {
    title: 'Áo dài lễ hội & Tết',
    description:
      'Mẫu màu tươi, dễ mặc và giá vừa phải cho Tết, hội xuân, văn nghệ, sinh hoạt cộng đồng và ảnh gia đình.',
    featuredKeywords: ['lễ hội', 'tết', 'hội xuân', 'ngày hội', 'văn nghệ', 'đỏ mai', 'vàng mai'],
    seoHeading: 'Áo dài lễ hội, áo dài Tết phổ thông cho nhóm và gia đình',
    seoBody:
      'Catalog áo dài lễ hội & Tết tập trung vào phom dễ mặc, chất liệu ít nhăn, màu sắc rạng rỡ và mức giá phù hợp để chuẩn bị nhiều bộ cùng lúc. Đây là nhóm sản phẩm dành cho hội hè, lễ Tết, chương trình văn nghệ, sinh hoạt đoàn thể hoặc các buổi chụp ảnh gia đình cần đồng bộ mà không quá trang trọng.',
  },
  'dong-phuc-tap-the': {
    title: 'Áo dài tập thể & đồng phục',
    description:
      'Các mẫu áo dài đồng bộ cho cơ quan, câu lạc bộ, đoàn hội, đội lễ tân và nhóm sự kiện cần đặt theo danh sách size.',
    featuredKeywords: ['đồng phục', 'tập thể', 'đoàn thể', 'công sở', 'nhận sỉ', 'đặt số lượng'],
    seoHeading: 'Áo dài đồng phục tập thể nhận đặt số lượng',
    seoBody:
      'Nhóm áo dài tập thể & đồng phục ưu tiên bảng màu dễ nhận diện, phom không kén dáng và khả năng chia size nhanh. Mỗi mẫu được trình bày theo hướng phục vụ đơn hàng số lượng: cơ quan, trường học, đoàn hội, câu lạc bộ, đội lễ tân hoặc nhóm biểu diễn cần hình ảnh thống nhất.',
  },
  'truong-lop-su-kien': {
    title: 'Áo dài trường lớp & sự kiện',
    description:
      'Áo dài cho khai giảng, 20/11, kỷ yếu, văn nghệ, chương trình chào mừng và các hoạt động tập thể của trường lớp.',
    featuredKeywords: ['trường lớp', 'kỷ yếu', '20/11', 'khai giảng', 'sự kiện', 'học đường'],
    seoHeading: 'Áo dài trường lớp, kỷ yếu và sự kiện giá dễ đặt',
    seoBody:
      'Catalog trường lớp & sự kiện dành cho những đơn cần nhiều size, màu dễ lên hình và chất liệu đủ thoải mái để mặc trong hội trường, sân trường hoặc buổi biểu diễn. Nội dung nhấn vào tính thực dụng: kín đáo, dễ chăm, dễ chốt số lượng và không đẩy cảm giác sang chảnh như áo dài dạ hội.',
  },
  'chup-anh-du-lich': {
    title: 'Áo dài chụp ảnh & du lịch',
    description:
      'Các mẫu nhẹ, sáng màu và dễ phối cho chụp ảnh phố cổ, du lịch, kỷ yếu, nhóm bạn hoặc ảnh gia đình ngoài trời.',
    featuredKeywords: ['chụp ảnh', 'du lịch', 'phố cổ', 'pastel', 'ngoài trời', 'nhóm bạn'],
    seoHeading: 'Áo dài chụp ảnh, du lịch và kỷ niệm dễ mặc',
    seoBody:
      'Áo dài chụp ảnh & du lịch giữ lại nét Việt nhưng giảm bớt sự nghi thức. Mẫu được chọn theo tiêu chí nhẹ, lên hình tốt, dễ di chuyển và có thể phối nhiều màu cho nhóm bạn, gia đình hoặc ekip chụp ngoại cảnh.',
  },
  'co-ban-so-luong': {
    title: 'Áo dài cơ bản số lượng sẵn',
    description:
      'Mẫu core giá tốt, ít chi tiết, dễ sản xuất lại và phù hợp các đơn cần số lượng lớn hoặc tiến độ nhanh.',
    featuredKeywords: ['cơ bản', 'số lượng sẵn', 'giá tốt', 'may nhanh', 'đơn gấp', 'size run'],
    seoHeading: 'Áo dài cơ bản giá tốt cho đơn số lượng',
    seoBody:
      'Nhóm áo dài cơ bản số lượng sẵn là lựa chọn thực dụng cho khách cần nhiều bộ, ngân sách rõ và thời gian giao nhanh. Các mẫu hạn chế chi tiết cầu kỳ, dùng chất liệu phổ thông bền màu và có bảng màu/size dễ chốt để phục vụ đơn tập thể, quà tặng sự kiện hoặc chương trình theo mùa.',
  },
};

export const merchandisingPages = {
  'new-in': {
    eyebrow: 'Mẫu mới',
    title: 'Mới về',
    description:
      'Những mẫu áo dài phổ thông mới nhất cho lễ hội, Tết, trường lớp và đơn tập thể cần chốt nhanh.',
  },
  bestsellers: {
    eyebrow: 'Được đặt nhiều',
    title: 'Bán chạy',
    description:
      'Các mẫu khách thường chọn khi cần số lượng: phom dễ mặc, màu dễ đồng bộ và mức giá dễ duyệt.',
  },
  sale: {
    eyebrow: 'Giá tốt',
    title: 'Ưu đãi theo lô',
    description:
      'Những mẫu đang có giá tốt để chuẩn bị cho Tết, chương trình văn nghệ, đồng phục hoặc chụp ảnh nhóm.',
  },
};

export const editorialPages = {
  campaigns: {
    'ao-dai-hoi-he': {
      eyebrow: 'Chiến dịch',
      title: 'Áo Dài Hội Hè',
      description:
        'Áo dài phổ thông cho những ngày vui chung: màu sáng, phom thoải mái, dễ mặc đồng bộ và không quá trang trọng.',
      bullets: ['Giá dễ đặt', 'Màu tươi', 'Phù hợp nhóm đông'],
      cta: { label: 'Xem áo dài lễ hội & Tết', to: '/collections/le-hoi-tet' },
    },
  },
  lookbook: {
    'dong-phuc-tap-the': {
      eyebrow: 'Đặt theo nhóm',
      title: 'Đồng Phục Tập Thể',
      description:
        'Gợi ý chọn màu, chia size và phối mẫu cho cơ quan, đoàn hội, câu lạc bộ hoặc đội biểu diễn cần sự thống nhất.',
      bullets: ['Chia size nhanh', 'Nhận danh sách số lượng', 'Có màu đồng bộ'],
      cta: { label: 'Xem áo dài đồng phục', to: '/collections/dong-phuc-tap-the' },
    },
  },
  occasions: {
    'tet-hoi-xuan': {
      eyebrow: 'Mua theo dịp',
      title: 'Tết & Hội Xuân',
      description:
        'Mẫu đỏ, vàng, xanh sáng cho ngày Tết, hội xuân, văn nghệ và ảnh gia đình với tinh thần vui, gần gũi.',
      bullets: ['Tết', 'Hội xuân', 'Ảnh gia đình'],
      cta: { label: 'Chuẩn bị áo dài Tết', to: '/collections/le-hoi-tet' },
    },
  },
};

export const homePageContent = {
  sectionControls: {
    campaigns: {
      eyebrow: 'Định hướng mua nhanh',
      title: 'Chọn theo dịp và số lượng, không cần tìm trong catalog quá rộng.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    newIn: {
      eyebrow: 'Mẫu mới',
      title: 'Các mẫu mới dễ đặt cho hội hè, Tết và hoạt động tập thể.',
      ctaLabel: 'Xem toàn bộ',
      ctaTo: '/new-in',
      enabled: true,
    },
    bestsellers: {
      eyebrow: 'Đặt nhiều',
      title: 'Những mẫu đang được chọn nhiều cho đơn nhóm.',
      ctaLabel: 'Xem mẫu bán chạy',
      ctaTo: '/bestsellers',
      enabled: true,
    },
    categories: {
      eyebrow: 'Catalog theo nhu cầu',
      title: 'Tìm nhanh theo dịp mặc, nhóm người dùng và tiến độ đặt hàng.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    occasions: {
      eyebrow: 'Mua theo bối cảnh',
      title: 'Gợi ý trực tiếp cho Tết, chụp ảnh, đồng phục và sự kiện.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    reviews: {
      eyebrow: 'Khách đặt số lượng',
      title: 'Phản hồi từ các đơn nhóm, trường lớp và chương trình theo mùa.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    ugc: {
      eyebrow: 'Ảnh thật / Mạng xã hội',
      title: 'Các cách mặc gần gũi trong dịp hội hè, Tết và chụp ảnh nhóm.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
  },
  uspItems: [
    { title: 'Nhận đơn số lượng', detail: 'Tư vấn size và màu theo danh sách nhóm' },
    { title: 'Mức giá phổ thông', detail: 'Tập trung mẫu dễ duyệt ngân sách' },
    { title: 'Size XS-XXL', detail: 'Dễ chia size cho cơ quan, lớp học, đoàn hội' },
    { title: 'Mẫu sẵn may nhanh', detail: 'Có nhóm hàng core cho tiến độ gấp' },
    { title: 'Đồng bộ màu', detail: 'Gợi ý phối màu cho đội hình và concept' },
  ],
  occasions: [
    {
      title: 'Tết & hội xuân',
      description: 'Màu đỏ, vàng, xanh sáng cho ngày vui chung, văn nghệ và ảnh gia đình.',
      to: '/occasions/tet-hoi-xuan',
      image: pexelsImage(36214254),
    },
    {
      title: 'Đồng phục tập thể',
      description: 'Mẫu dễ chia size cho cơ quan, đoàn hội, câu lạc bộ và đội lễ tân.',
      to: '/lookbook/dong-phuc-tap-the',
      image: pexelsImage(32279111),
    },
    {
      title: 'Trường lớp & kỷ yếu',
      description: 'Áo dài trắng, pastel và màu sân khấu cho khai giảng, 20/11, văn nghệ.',
      to: '/collections/truong-lop-su-kien',
      image: pexelsImage(31829686),
    },
  ],
  reviews: [
    {
      quote: 'Đặt hơn 40 bộ cho chương trình hội xuân, shop chia size rõ và màu lên đội hình rất đều.',
      name: 'Hạnh P.',
      meta: 'Đơn tập thể 40+ bộ',
      rating: 5,
    },
    {
      quote: 'Mẫu trắng học đường giá vừa phải, lớp mình mặc chụp kỷ yếu nhìn đồng bộ mà không bị cầu kỳ.',
      name: 'Ngọc A.',
      meta: 'Đơn kỷ yếu',
      rating: 5,
    },
    {
      quote: 'Tư vấn màu nhanh, mẫu đỏ Tết dễ mặc cho nhiều độ tuổi trong nhóm văn nghệ.',
      name: 'Thu N.',
      meta: 'Nhóm văn nghệ',
      rating: 5,
    },
  ],
  newsletter: {
    eyebrow: 'Báo giá & mẫu mới',
    title: 'Nhận catalog áo dài phổ thông, bảng màu và gợi ý đặt số lượng.',
    description:
      'Đăng ký để nhận mẫu mới theo mùa, gợi ý phối màu cho nhóm và thông tin ưu đãi khi đặt nhiều bộ.',
  },
  ugcPosts: [
    {
      platform: 'Instagram',
      handle: '@minhthu.studio',
      caption: 'Áo dài trắng đồng bộ cho buổi chụp ngoài phố, nhẹ và rất dễ mặc.',
      image: pexelsImage(32279111),
    },
    {
      platform: 'TikTok',
      handle: '@dailywithlan',
      caption: 'Thử áo dài hồng phấn cho nhóm văn nghệ, màu lên sân khấu rất sáng.',
      image: pexelsImage(30480186),
    },
    {
      platform: 'Instagram',
      handle: '@trangwears',
      caption: 'Áo dài đỏ cho Tết và hội xuân, đủ nổi bật mà không quá cầu kỳ.',
      image: pexelsImage(36214254),
    },
    {
      platform: 'TikTok',
      handle: '@an.edit',
      caption: 'Mẫu mint đồng bộ cho câu lạc bộ, nhìn trẻ và dễ di chuyển.',
      image: pexelsImage(31309811),
    },
  ],
};

export const infoPages = {
  about: {
    eyebrow: 'Thương hiệu',
    title: 'Về Áo Dài Rạng Rỡ',
    intro:
      'Chúng tôi tập trung vào áo dài phổ thông, dễ mặc và dễ đặt theo số lượng cho lễ Tết, hội hè, trường lớp, cơ quan và hoạt động tập thể.',
    sections: [
      {
        title: 'Định hướng sản phẩm',
        body:
          'Mỗi mẫu được chọn theo tiêu chí phom không kén dáng, chất liệu dễ chăm, màu lên đội hình đẹp và mức giá phù hợp cho khách cần nhiều bộ cùng lúc.',
      },
      {
        title: 'Nhận đơn số lượng',
        body:
          'Khách có thể gửi danh sách size, màu mong muốn và thời gian cần hàng. Chúng tôi tư vấn mẫu sẵn, mẫu may nhanh hoặc phương án phối màu theo ngân sách.',
      },
      {
        title: 'Không theo hướng dạ hội',
        body:
          'Catalog hạn chế chi tiết quá cầu kỳ, đính kết nặng hoặc cảm giác sang chảnh. Tinh thần chính là gần gũi, vui, dễ mặc và phù hợp hoạt động cộng đồng.',
      },
    ],
  },
  'size-guide': {
    eyebrow: 'Hỗ trợ chọn size',
    title: 'Hướng dẫn size',
    intro:
      'Hãy dùng bảng này để chốt size cá nhân hoặc lập danh sách cho nhóm. Với đơn số lượng, nên cộng thêm ghi chú chiều cao và cân nặng để tư vấn nhanh hơn.',
    table: {
      headers: ['Size', 'Ngực', 'Eo', 'Hông'],
      rows: [
        ['XS', '80-84 cm', '60-64 cm', '86-90 cm'],
        ['S', '84-88 cm', '64-68 cm', '90-94 cm'],
        ['M', '88-94 cm', '68-74 cm', '94-100 cm'],
        ['L', '94-100 cm', '74-80 cm', '100-106 cm'],
        ['XL', '100-106 cm', '80-86 cm', '106-112 cm'],
        ['XXL', '106-112 cm', '86-94 cm', '112-118 cm'],
      ],
    },
  },
  delivery: {
    eyebrow: 'Vận chuyển',
    title: 'Giao hàng',
    intro:
      'Đơn hàng được xử lý từ thứ Hai đến thứ Bảy. Với đơn số lượng, thời gian giao sẽ được xác nhận theo mẫu, size run và địa điểm nhận hàng.',
    sections: [
      {
        title: 'Đơn lẻ và mẫu sẵn',
        body:
          'Sản phẩm sẵn thường rời kho trong vòng 1-2 ngày làm việc sau khi xác nhận thanh toán.',
      },
      {
        title: 'Đơn số lượng',
        body:
          'Đơn nhóm cần thời gian kiểm size, đóng gói theo danh sách và kiểm số lượng. Hãy gửi deadline sự kiện để được tư vấn phương án phù hợp.',
      },
      {
        title: 'Đóng gói',
        body:
          'Đơn tập thể có thể đóng theo từng size, từng tên hoặc từng nhóm để người nhận dễ phát trang phục.',
      },
    ],
  },
  returns: {
    eyebrow: 'Hậu mãi',
    title: 'Đổi trả',
    intro:
      'Chúng tôi hỗ trợ đổi size với sản phẩm đủ điều kiện. Đơn số lượng hoặc hàng may/điều chỉnh riêng sẽ được xác nhận chính sách trước khi sản xuất.',
    sections: [
      {
        title: 'Sản phẩm sẵn',
        body:
          'Sản phẩm chưa mặc, chưa giặt và còn tag có thể yêu cầu đổi trả trong vòng 14 ngày kể từ lúc nhận.',
      },
      {
        title: 'Đơn đặt số lượng',
        body:
          'Các đơn đã chốt danh sách size, thêu logo hoặc chỉnh riêng không áp dụng đổi trả đại trà. Shop sẽ hỗ trợ kiểm size trước khi chốt để giảm sai lệch.',
      },
      {
        title: 'Đổi size',
        body:
          'Nếu còn hàng cùng mẫu, shop ưu tiên đổi size cho khách trong thời gian sớm nhất, đặc biệt với đơn cần kịp sự kiện.',
      },
    ],
  },
  faq: {
    eyebrow: 'Hỗ trợ',
    title: 'Câu hỏi thường gặp',
    intro:
      'Những thông tin khách thường hỏi trước khi đặt áo dài cho nhóm, lớp, cơ quan hoặc dịp lễ Tết.',
    faqs: [
      {
        question: 'Shop có nhận đơn số lượng không?',
        answer:
          'Có. Bạn có thể gửi số lượng, bảng size dự kiến, màu mong muốn và ngày cần hàng để được gợi ý mẫu sẵn hoặc mẫu may nhanh.',
      },
      {
        question: 'Có thể đặt nhiều màu trong cùng một mẫu không?',
        answer:
          'Có, tùy mẫu và tồn kho vải. Với đội hình chụp ảnh hoặc văn nghệ, shop có thể gợi ý phối 2-3 màu để tổng thể vẫn đồng bộ.',
      },
      {
        question: 'Tôi nên chọn size thế nào cho nhóm đông?',
        answer:
          'Nên lập danh sách gồm họ tên, chiều cao, cân nặng, số đo ngực/e ngắn nếu có. Shop sẽ đối chiếu bảng size và gợi ý tăng/giảm size cho từng trường hợp.',
      },
    ],
  },
  contact: {
    eyebrow: 'Liên hệ',
    title: 'Liên hệ',
    intro:
      'Nếu bạn cần báo giá số lượng, tư vấn size, phối màu cho đội nhóm hoặc lịch giao theo sự kiện, hãy liên hệ qua các kênh dưới đây.',
    cards: [
      { title: 'Tư vấn đơn số lượng', detail: 'bulk@fashionstore.com', note: 'Gửi số lượng, deadline và màu mong muốn' },
      { title: 'Chăm sóc khách hàng', detail: 'care@fashionstore.com', note: 'Phản hồi trong vòng 24 giờ' },
      { title: 'Giờ làm việc', detail: 'Thứ Hai - Thứ Bảy, 9:00-18:00', note: 'GMT+7' },
    ],
    storeLocation: {
      title: 'Áo Dài Rạng Rỡ',
      address: 'Hồ Hoàn Kiếm, Hà Nội',
      coordinates: '21.028511,105.804817',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=21.028511,105.804817',
      embedUrl: '',
    },
  },
  'track-order': {
    eyebrow: 'Trạng thái đơn hàng',
    title: 'Theo dõi đơn',
    intro:
      'Nhập mã đơn hàng để xem tiến trình xử lý. Với đơn số lượng, cửa hàng sẽ cập nhật thêm các mốc chốt size, chuẩn bị hàng và bàn giao vận chuyển.',
    steps: ['Đã xác nhận đơn', 'Đã chốt size/màu', 'Đang chuẩn bị hàng', 'Đã bàn giao vận chuyển'],
  },
};
