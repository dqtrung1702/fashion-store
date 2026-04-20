# Fashion Store

A fashion storefront built with React, FastAPI, MongoDB, and MinIO.

## Current Status

- Public storefront is running on React + Vite
- Admin panel is available directly on the web at `/admin`
- Products, collections, content, orders, authenticated cart, and authenticated wishlist have backend persistence
- Product image upload goes through backend to MinIO
- Guest cart and guest wishlist still use local browser state
- Checkout currently creates an order in `pending` state; there is no real payment gateway yet

## Main Features

### Storefront
- Home, collection, product detail, search, new in, bestsellers, sale
- Campaign, lookbook, occasion landing pages
- About, size guide, delivery, returns, FAQ, contact, track order
- Wishlist, account, cart, checkout, orders

### Commerce
- Product variants by size/color/SKU/stock
- Cart validation against stock
- Guest cart sync against latest catalog data
- Order creation, tracking, and cancellation
- Admin order status updates

### Admin
- Create, edit, delete products
- Upload cover and gallery images to MinIO
- Create, edit, delete collections
- Edit homepage, editorial, merchandising, and info-page content
- Update order status directly from `/admin`

## Tech Stack

### Backend
- FastAPI
- PyMongo
- Pydantic
- JWT auth
- MinIO SDK

### Frontend
- React 18
- Vite
- Zustand
- Axios
- React Router
- Tailwind CSS

### Infrastructure
- Docker Compose
- MongoDB
- MinIO

## Project Structure

```text
fashion-store/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── order_flow.py
│   ├── storage.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── content.py
│   │   ├── cart.py
│   │   ├── wishlist.py
│   │   ├── orders.py
│   │   ├── admin.py
│   │   └── admin_content.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── store/
│   ├── vite.config.js
│   └── index.html
├── docker-compose.yml
├── start.sh
└── docs/
    ├── technical-handoff.html
    ├── data-model.html
    ├── data-model.md
    └── architech.html
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Quick Start with Docker

```bash
cd /home/fashion-store
cp backend/.env.example backend/.env
./start.sh
```

### Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

## Default Admin User

The backend auto-seeds an admin user on startup:

```text
Username: admin
Email: admin@fashionstore.com
Password: Admin123!
```

Admin panel:

```text
http://localhost:5173/admin
```

When logged in as admin, the public header also shows a direct `Vào Admin` link.

## Local Development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Overview

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

### Catalog
- `GET /api/products/`
- `GET /api/products/search`
- `GET /api/products/{id}`
- `GET /api/products/categories/list`
- `GET /api/products/collections`

### Content
- `GET /api/content/`

### Cart & Wishlist
- `GET /api/cart/`
- `POST /api/cart/items`
- `PATCH /api/cart/items/{product_id}`
- `DELETE /api/cart/items/{product_id}`
- `DELETE /api/cart/`
- `GET /api/wishlist/`
- `POST /api/wishlist/items`
- `DELETE /api/wishlist/items/{product_id}`

### Orders
- `POST /api/orders/`
- `GET /api/orders/`
- `GET /api/orders/{id}`
- `GET /api/orders/track`
- `PATCH /api/orders/{id}/cancel`

### Admin
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`
- `GET /api/admin/collections`
- `POST /api/admin/collections`
- `PUT /api/admin/collections/{slug}`
- `DELETE /api/admin/collections/{slug}`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/{id}/status`
- `POST /api/admin/uploads/products`
- `GET /api/admin/stats`
- `GET /api/admin/content/`
- `POST /api/admin/content/import`

## Storage & Data Ownership

- MongoDB stores users, products, collections, content, orders, authenticated carts, and authenticated wishlists
- MinIO stores uploaded product images
- `localStorage` is still used for:
  - auth cache
  - guest cart
  - guest wishlist
  - fallback catalog/content state when backend is empty or unavailable

## Important Notes

- Catalog and content are now remote-first, but still have local fallback paths
- Guest cart and guest wishlist are browser-local by design right now
- Checkout does not capture payment; it creates an order and leaves it in a pending/manual-confirmation flow
- Admin can update order statuses from the web UI
- For the most accurate current architecture, read:
  1. `docs/technical-handoff.html`
  2. `docs/data-model.html`
  3. `docs/architech.html`

## Useful Commands

```bash
# Start
docker compose up -d --build

# Stop
docker compose down

# Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
docker compose logs -f minio

# Mongo shell
docker compose exec mongodb mongosh -u admin -p admin
```

## Deployment Notes

Before production:

1. Change `SECRET_KEY`
2. Set production CORS origins
3. Move MinIO to production-grade object storage or operate MinIO properly
4. Add HTTPS
5. Verify production frontend build and memory limits
6. Add monitoring and backup strategy
