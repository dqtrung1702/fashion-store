import API from './api';

export const productsService = {
  getAll: (params = {}) =>
    API.get('/products/', { params }),

  getById: (id) => API.get(`/products/${id}`),
  
  getCategories: () => API.get('/products/categories/list'),

  getCollections: (activeOnly = false) =>
    API.get('/products/collections', { params: { active_only: activeOnly } }),
};

export const contentService = {
  get: () => API.get('/content/'),
};

export const cartService = {
  get: () => API.get('/cart/'),
  
  addItem: (item) => API.post('/cart/items', item),

  updateItem: (productId, item) => API.patch(`/cart/items/${productId}`, item),
  
  removeItem: (productId, variantId, variantSku) =>
    API.delete(`/cart/items/${productId}`, { params: { variantId, variantSku } }),
  
  clear: () => API.delete('/cart/'),
};

export const wishlistService = {
  get: () => API.get('/wishlist/'),

  addItem: (productId) => API.post('/wishlist/items', { product_id: productId }),

  removeItem: (productId) => API.delete(`/wishlist/items/${productId}`),

  clear: () => API.delete('/wishlist/'),
};

export const ordersService = {
  getAll: () => API.get('/orders/'),
  
  getById: (id) => API.get(`/orders/${id}`),
  
  create: (order) => API.post('/orders/', order),

  track: (orderNumber) =>
    API.get('/orders/track', { params: { orderNumber } }),
  
  cancel: (id) => API.patch(`/orders/${id}/cancel`),
};

export const authService = {
  register: (data) => API.post('/auth/register', data),
  
  login: (username, password) =>
    API.post('/auth/login', { username, password }),

  me: () => API.get('/auth/me'),

  updateMe: (payload) => API.patch('/auth/me', payload),
  
  logout: () => API.post('/auth/logout'),
};

export const adminService = {
  getProducts: () => API.get('/admin/products'),

  createProduct: (product) => API.post('/admin/products', product),
  
  updateProduct: (id, product) => API.put(`/admin/products/${id}`, product),
  
  deleteProduct: (id) => API.delete(`/admin/products/${id}`),

  getCollections: () => API.get('/admin/collections'),

  createCollection: (collection) => API.post('/admin/collections', collection),

  updateCollection: (slug, collection) => API.put(`/admin/collections/${slug}`, collection),

  deleteCollection: (slug) => API.delete(`/admin/collections/${slug}`),

  getOrders: () => API.get('/admin/orders'),

  updateOrderStatus: (id, status) => API.patch(`/admin/orders/${id}/status`, { status }),

  importCatalog: (payload) => API.post('/admin/catalog/import', payload),

  getProductImages: (params = {}) => API.get('/admin/uploads/products', { params }),

  deleteProductImage: (objectName) =>
    API.delete('/admin/uploads/products', { params: { object_name: objectName } }),

  getContent: () => API.get('/admin/content/'),

  importContent: (payload) => API.post('/admin/content/import', payload),

  uploadProductImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/admin/uploads/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getStats: () => API.get('/admin/stats'),
};
