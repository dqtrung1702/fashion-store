export const navigationGroups = {
  shop: [
    { label: 'New In', to: '/new-in' },
    { label: 'Bestsellers', to: '/bestsellers' },
    { label: 'Value Picks', to: '/sale' },
    { label: 'Festival & Tet', to: '/collections/le-hoi-tet' },
    { label: 'Group Uniforms', to: '/collections/dong-phuc-tap-the' },
    { label: 'School & Events', to: '/collections/truong-lop-su-kien' },
  ],
  editorial: [
    { label: 'Festival Ao Dai', to: '/campaigns/ao-dai-hoi-he' },
    { label: 'Bulk Uniforms', to: '/lookbook/dong-phuc-tap-the' },
    { label: 'Tet & Spring Fairs', to: '/occasions/tet-hoi-xuan' },
  ],
  support: [
    { label: 'About', to: '/about' },
    { label: 'Size Guide', to: '/size-guide' },
    { label: 'Delivery', to: '/delivery' },
    { label: 'Returns', to: '/returns' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact', to: '/contact' },
    { label: 'Track Order', to: '/track-order' },
  ],
};

export const footerGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'New In', to: '/new-in' },
      { label: 'Bestsellers', to: '/bestsellers' },
      { label: 'Value Picks', to: '/sale' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Account', to: '/account' },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { label: 'Festival & Tet Ao Dai', to: '/collections/le-hoi-tet' },
      { label: 'Group Uniform Ao Dai', to: '/collections/dong-phuc-tap-the' },
      { label: 'School & Event Ao Dai', to: '/collections/truong-lop-su-kien' },
      { label: 'Photo & Travel Ao Dai', to: '/collections/chup-anh-du-lich' },
      { label: 'Ready Bulk Basics', to: '/collections/co-ban-so-luong' },
    ],
  },
  {
    title: 'Support',
    links: navigationGroups.support,
  },
];

export const collectionDefinitions = {
  'le-hoi-tet': {
    title: 'Festival & Tet Ao Dai',
    description:
      'Bright, easy-to-wear ao dai for Tet, spring fairs, community events, performances and family photos.',
    featuredKeywords: ['festival', 'tet', 'spring fair', 'performance', 'red', 'yellow'],
    seoHeading: 'Affordable festival and Tet ao dai for groups and families',
    seoBody:
      'This catalog focuses on easy fits, low-crease fabrics, cheerful colors and accessible pricing for customers who need several outfits at once. It serves Tet, festivals, performances, community events and family photos without the formality of eveningwear.',
  },
  'dong-phuc-tap-the': {
    title: 'Group Uniform Ao Dai',
    description:
      'Coordinated ao dai for offices, clubs, associations, reception teams and event groups ordering by size list.',
    featuredKeywords: ['uniform', 'group', 'bulk', 'team', 'office', 'association'],
    seoHeading: 'Group uniform ao dai for bulk orders',
    seoBody:
      'Group uniform ao dai prioritize recognizable colors, inclusive fits and quick size planning. Each style is framed for bulk orders from offices, schools, associations, clubs, reception teams and performance groups.',
  },
  'truong-lop-su-kien': {
    title: 'School & Event Ao Dai',
    description:
      'Ao dai for school ceremonies, Teachers Day, graduation photos, performances and group programs.',
    featuredKeywords: ['school', 'event', 'graduation photos', 'teachers day', 'performance'],
    seoHeading: 'School, class and event ao dai with practical pricing',
    seoBody:
      'School & event ao dai are made for many sizes, photo-friendly colors and fabrics that stay comfortable in auditoriums, courtyards and performances. The positioning is practical, modest and easy to order in quantity.',
  },
  'chup-anh-du-lich': {
    title: 'Photo & Travel Ao Dai',
    description:
      'Light, bright ao dai for old-town shoots, travel, class photos, friend groups and outdoor family memories.',
    featuredKeywords: ['photo', 'travel', 'old town', 'pastel', 'outdoor', 'group'],
    seoHeading: 'Photo, travel and memory ao dai that feel easy to wear',
    seoBody:
      'Photo & travel ao dai keep a Vietnamese mood while lowering the formality. Styles are light, camera-friendly and easy to move in for friend groups, families and outdoor shoots.',
  },
  'co-ban-so-luong': {
    title: 'Ready Bulk Basics',
    description:
      'Core, value-focused ao dai with simple details, repeatable production and faster timelines for larger orders.',
    featuredKeywords: ['basic', 'ready stock', 'bulk', 'fast order', 'value'],
    seoHeading: 'Basic value ao dai for larger quantity orders',
    seoBody:
      'Ready bulk basics are practical choices for customers who need many outfits, clear budgets and fast delivery. Styles limit complex details, use durable everyday fabrics and offer easy color and size planning.',
  },
};

export const merchandisingPages = {
  'new-in': {
    eyebrow: 'New styles',
    title: 'New In',
    description:
      'Fresh everyday ao dai for festivals, Tet, schools and group orders that need quick decisions.',
  },
  bestsellers: {
    eyebrow: 'Most ordered',
    title: 'Bestsellers',
    description:
      'Popular styles for bulk orders: easy fits, group-friendly colors and pricing that is easy to approve.',
  },
  sale: {
    eyebrow: 'Value picks',
    title: 'Bulk Offers',
    description:
      'Value-focused styles for Tet, performances, uniforms and group photos.',
  },
};

export const editorialPages = {
  campaigns: {
    'ao-dai-hoi-he': {
      eyebrow: 'Campaign',
      title: 'Festival Ao Dai',
      description:
        'Everyday ao dai for shared celebrations: bright color, comfortable fit and easy coordination for groups.',
      bullets: ['Accessible pricing', 'Bright colors', 'Group friendly'],
      cta: { label: 'Shop festival & Tet ao dai', to: '/collections/le-hoi-tet' },
    },
  },
  lookbook: {
    'dong-phuc-tap-the': {
      eyebrow: 'Bulk order',
      title: 'Group Uniforms',
      description:
        'Color, size and styling guidance for offices, associations, clubs and performance teams that need a coordinated look.',
      bullets: ['Fast size planning', 'Bulk lists supported', 'Coordinated colors'],
      cta: { label: 'Shop group uniforms', to: '/collections/dong-phuc-tap-the' },
    },
  },
  occasions: {
    'tet-hoi-xuan': {
      eyebrow: 'Shop by moment',
      title: 'Tet & Spring Fairs',
      description:
        'Red, yellow and bright blue ao dai for Tet, spring fairs, performances and family photos with a friendly mood.',
      bullets: ['Tet', 'Spring fairs', 'Family photos'],
      cta: { label: 'Prepare Tet ao dai', to: '/collections/le-hoi-tet' },
    },
  },
};

export const homePageContent = {
  sectionControls: {
    campaigns: {
      eyebrow: 'Shop faster',
      title: 'Choose by occasion and quantity instead of browsing an overly broad catalog.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    newIn: {
      eyebrow: 'New styles',
      title: 'New styles for festivals, Tet and group activities.',
      ctaLabel: 'View all',
      ctaTo: '/new-in',
      enabled: true,
    },
    bestsellers: {
      eyebrow: 'Most ordered',
      title: 'Styles customers choose for group orders.',
      ctaLabel: 'View bestsellers',
      ctaTo: '/bestsellers',
      enabled: true,
    },
    categories: {
      eyebrow: 'Catalog by need',
      title: 'Find styles by occasion, wearer group and order timeline.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    occasions: {
      eyebrow: 'Shop by use',
      title: 'Direct paths for Tet, photos, uniforms and events.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    reviews: {
      eyebrow: 'Bulk customers',
      title: 'Notes from group, school and seasonal orders.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
    ugc: {
      eyebrow: 'Real looks / Social',
      title: 'Casual ways to wear ao dai for festivals, Tet and group photos.',
      ctaLabel: '',
      ctaTo: '',
      enabled: true,
    },
  },
  uspItems: [
    { title: 'Bulk orders supported', detail: 'Size and color advice by group list' },
    { title: 'Accessible pricing', detail: 'Focused on budget-friendly styles' },
    { title: 'Sizes XS-XXL', detail: 'Easier planning for teams and classes' },
    { title: 'Ready fast basics', detail: 'Core styles for tighter timelines' },
    { title: 'Color coordination', detail: 'Palette guidance for group concepts' },
  ],
  occasions: [
    {
      title: 'Tet & spring fairs',
      description: 'Bright red, yellow and blue styles for shared festive moments.',
      to: '/occasions/tet-hoi-xuan',
      image: '',
    },
    {
      title: 'Group uniforms',
      description: 'Easy size planning for offices, associations, clubs and reception teams.',
      to: '/lookbook/dong-phuc-tap-the',
      image: '',
    },
    {
      title: 'School & class photos',
      description: 'White, pastel and performance colors for school ceremonies and photos.',
      to: '/collections/truong-lop-su-kien',
      image: '',
    },
  ],
  reviews: [
    {
      quote: 'We ordered over 40 sets for a spring fair. Size planning was clear and the colors looked even as a group.',
      name: 'Hanh P.',
      meta: '40+ piece group order',
      rating: 5,
    },
    {
      quote: 'The white school ao dai was affordable and looked coordinated for our graduation photos.',
      name: 'Ngoc A.',
      meta: 'Class photo order',
      rating: 5,
    },
    {
      quote: 'Color advice was quick. The red Tet style worked well across different ages in our performance group.',
      name: 'Thu N.',
      meta: 'Performance group',
      rating: 5,
    },
  ],
  newsletter: {
    eyebrow: 'Quote & new styles',
    title: 'Get the everyday ao dai catalog, color board and bulk-order ideas.',
    description:
      'Sign up for seasonal styles, group color guidance and offers for multi-piece orders.',
  },
  ugcPosts: [
    {
      platform: 'Instagram',
      handle: '@minhthu.studio',
      caption: 'Coordinated white ao dai for a city shoot, light and easy to wear.',
      image: '',
    },
    {
      platform: 'TikTok',
      handle: '@dailywithlan',
      caption: 'Trying blush pink ao dai for a performance group. The color is bright on stage.',
      image: '',
    },
    {
      platform: 'Instagram',
      handle: '@trangwears',
      caption: 'Red ao dai for Tet and spring fairs, cheerful without feeling too formal.',
      image: '',
    },
    {
      platform: 'TikTok',
      handle: '@an.edit',
      caption: 'Mint ao dai for a club team, young and easy to move in.',
      image: '',
    },
  ],
};

export const infoPages = {
  about: {
    eyebrow: 'Brand',
    title: 'About Radiant Ao Dai',
    intro:
      'We focus on everyday ao dai that are easy to wear and easy to order in quantity for Tet, festivals, schools, offices and group activities.',
    sections: [
      {
        title: 'Product direction',
        body:
          'Each style is chosen for inclusive fit, easy-care fabric, group-friendly colors and pricing that works when customers need many pieces at once.',
      },
      {
        title: 'Bulk orders',
        body:
          'Customers can send size lists, preferred colors and event deadlines. We suggest ready styles, faster production options or color plans by budget.',
      },
      {
        title: 'Not eveningwear',
        body:
          'The catalog avoids heavy embellishment and luxury eveningwear cues. The main mood is friendly, practical, cheerful and suitable for community activities.',
      },
    ],
  },
  'size-guide': {
    eyebrow: 'Fit support',
    title: 'Size Guide',
    intro:
      'Use this chart for personal orders or group size lists. For bulk orders, add height and weight notes to speed up fit advice.',
    table: {
      headers: ['Size', 'Bust', 'Waist', 'Hip'],
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
    eyebrow: 'Shipping',
    title: 'Delivery',
    intro:
      'Orders are processed Monday to Saturday. Bulk-order timelines are confirmed by style, size run and delivery location.',
    sections: [
      {
        title: 'Single orders and ready stock',
        body:
          'Ready-stock products usually leave within 1-2 business days after payment confirmation.',
      },
      {
        title: 'Bulk orders',
        body:
          'Group orders need time for size checks, quantity checks and packing by list. Share your event deadline for the best plan.',
      },
      {
        title: 'Packing',
        body:
          'Group orders can be packed by size, name or subgroup to make distribution easier.',
      },
    ],
  },
  returns: {
    eyebrow: 'Aftercare',
    title: 'Returns',
    intro:
      'We support size exchanges for eligible ready products. Bulk orders or customized items will have policy confirmation before production.',
    sections: [
      {
        title: 'Ready products',
        body:
          'Unworn, unwashed products with tags can request return or exchange within 14 days of delivery.',
      },
      {
        title: 'Bulk orders',
        body:
          'Orders with finalized size lists, logo embroidery or custom adjustments are not broadly returnable. We help check sizing before confirmation.',
      },
      {
        title: 'Size exchange',
        body:
          'If the same style is available, we prioritize size exchange quickly, especially for event timelines.',
      },
    ],
  },
  faq: {
    eyebrow: 'Support',
    title: 'FAQ',
    intro:
      'Common questions before ordering ao dai for groups, classes, offices or festive programs.',
    faqs: [
      {
        question: 'Do you support bulk orders?',
        answer:
          'Yes. Send quantity, estimated size list, preferred colors and the date you need the order. We will suggest ready or faster-production options.',
      },
      {
        question: 'Can one style be ordered in multiple colors?',
        answer:
          'Often yes, depending on fabric stock. For photos and performances, we can suggest two or three coordinated colors.',
      },
      {
        question: 'How should I choose sizes for a large group?',
        answer:
          'Prepare a list with name, height, weight and bust/waist when available. We will compare it with the size chart and suggest adjustments.',
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Contact',
    intro:
      'For bulk quotes, size advice, group color planning or event delivery timelines, reach us through the channels below.',
    cards: [
      { title: 'Bulk order advice', detail: 'bulk@fashionstore.com', note: 'Send quantity, deadline and preferred colors' },
      { title: 'Customer care', detail: 'care@fashionstore.com', note: 'Replies within 24 hours' },
      { title: 'Business hours', detail: 'Monday - Saturday, 9:00-18:00', note: 'GMT+7' },
    ],
    storeLocation: {
      title: 'Radiant Ao Dai',
      address: 'Hoan Kiem Lake, Hanoi',
      coordinates: '21.028511,105.804817',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=21.028511,105.804817',
      embedUrl: '',
    },
  },
  'track-order': {
    eyebrow: 'Order status',
    title: 'Track Order',
    intro:
      'Enter your order number to view processing progress. For bulk orders, updates may include size confirmation, preparation and handoff to courier.',
    steps: ['Order confirmed', 'Size/color confirmed', 'Preparing items', 'Handed to courier'],
  },
};
