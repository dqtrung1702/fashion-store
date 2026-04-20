# Quick Start Guide

## Recommended Start

```bash
cd /home/fashion-store
cp backend/.env.example backend/.env
./start.sh
```

If you want to run Docker manually:

```bash
cd /home/fashion-store
cp backend/.env.example backend/.env
docker compose up -d --no-build
```

For the first setup or when Docker dependencies change, build once while online:

```bash
./start.sh --build
```

## Access URLs

After the stack is up:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
- Redis runs inside Docker only and is not exposed to the host by default.

## Admin Login

Go to:

- http://localhost:5173/login

Use:

- Username: `admin`
- Password: `Admin123!`

Admin panel:

- http://localhost:5173/admin

When logged in as admin, the public header also shows a direct link to `/admin`.

## What You Can Test Quickly

### Storefront

1. Browse homepage, collection pages, and product detail pages
2. Add products to cart
3. Test guest cart behavior
4. Proceed to checkout

### Orders

1. Place an order from checkout
2. Use track order with order number + email
3. Log in as admin
4. Go to `/admin`
5. Open `Quản lý đơn hàng`
6. Change order status and verify timeline updates

### Admin CMS

From `/admin`, you can:

- create/edit/delete products
- assign one product to multiple collections/categories
- download an Excel product template
- import products in bulk from Excel
- export current products to Excel without images
- upload cover and gallery images
- create/edit/delete collections
- edit homepage, editorial, merchandising, and support content
- update order statuses

## Important Current Behavior

- Product images are uploaded through backend to MinIO
- Products, collections, content, orders, authenticated cart, and authenticated wishlist are stored server-side
- Public products, collections, category lists, and content are cached in Redis. Admin product/collection/content changes automatically invalidate the matching cache.
- Guest cart and guest wishlist are still local to the browser
- Checkout does not process a real online payment yet
- New orders are created in a pending/manual-confirmation flow
- Catalog and content are remote-first, but still have local fallback behavior if backend data is empty or unavailable
- The Docker frontend service serves a production build with `vite preview`, not the Vite dev client. This avoids CSP `unsafe-eval` warnings from dev tooling.

## Stop the Project

```bash
docker compose down
```

To stop and also remove volumes:

```bash
docker compose down -v
```

## Development

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

## Production Deployment With Nginx

Production uses `docker-compose.prod.yml` and an `nginx` service as the only public entrypoint. Nginx serves the built frontend, proxies `/api/` to FastAPI, and proxies `/fashion-store-assets/` to MinIO.

### 1. Prepare the Host

On the production host:

- Install Docker and Docker Compose.
- Point your domain DNS A record to the server IP.
- Open only `80`, `443`, and SSH in the firewall.
- Do not expose MongoDB `27017`, Redis `6379`, MinIO `9000/9001`, or backend `8000` publicly.

### 2. Create Production Env

```bash
cd /home/fashion-store
cp .env.production.example .env.production
```

Edit `.env.production` before starting:

```env
HTTP_PORT=80
CORS_ORIGINS=https://your-domain.com
MINIO_PUBLIC_ENDPOINT=your-domain.com
MINIO_PUBLIC_SECURE=true

SECRET_KEY=change-this-to-a-long-random-secret
MONGO_INITDB_ROOT_USERNAME=fashion_admin
MONGO_INITDB_ROOT_PASSWORD=change-this-mongo-password
MINIO_ROOT_USER=fashion_minio
MINIO_ROOT_PASSWORD=change-this-minio-password

ADMIN_SEED_ENABLED=true
ADMIN_EMAIL=admin@your-domain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-admin-password
```

Use long random values for `SECRET_KEY`, MongoDB password, MinIO password, and admin password.

### 3. Start Production

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

If you previously ran the dev compose on the same host, remove orphan containers:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
```

### 4. Verify Production

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

Open:

```text
http://your-domain.com
http://your-domain.com/admin
http://your-domain.com/api/content/
```

Expected behavior:

- `/` returns the storefront.
- `/admin` opens the admin UI after login.
- `/api/...` is proxied by Nginx to backend.
- Product image URLs use `https://your-domain.com/fashion-store-assets/...` when `MINIO_PUBLIC_SECURE=true`.
- MongoDB, Redis, MinIO, and backend have no public ports in `docker-compose.prod.yml`.

### 5. Disable Admin Seeding After First Login

After you log in successfully and confirm the admin account works, edit `.env.production`:

```env
ADMIN_SEED_ENABLED=false
```

Then restart backend:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d backend
```

### 6. HTTPS

The included production compose exposes HTTP on port `80`. For HTTPS, use one of these:

- Put the host behind Cloudflare and enable HTTPS there.
- Add Certbot/Let's Encrypt for Nginx on the server.
- Replace Nginx with Caddy if you want automatic certificates.

Do not add `unsafe-eval` to CSP for production. The production Nginx config serves built frontend assets and does not require Vite dev tooling.

### 7. Production Maintenance

View logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f mongodb
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f redis
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f minio
```

Restart:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

Stop:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Rebuild after code changes:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 8. Production Backups

Back up MongoDB and MinIO data regularly. Redis is cache only and does not need backup.

MongoDB example:

```bash
mkdir -p backups
docker compose --env-file .env.production -f docker-compose.prod.yml exec mongodb \
  sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive=/tmp/fashion-store.gz --gzip'
docker compose --env-file .env.production -f docker-compose.prod.yml cp mongodb:/tmp/fashion-store.gz ./backups/fashion-store-$(date +%F).gz
```

MinIO data is in the Docker volume `minio_data`. For production, use a volume backup tool, object replication, or migrate media storage to S3/R2 if you want simpler managed backups.

## Deploy Frontend To MinIO (Legacy/Optional)

Build the Vite frontend and upload `frontend/dist` to a public MinIO bucket:

```bash
./scripts/deploy_frontend_to_minio.sh
```

Default bucket:

```text
fashion-store-frontend
```

Open:

```text
http://localhost:9000/fashion-store-frontend/index.html
```

To use another bucket:

```bash
FRONTEND_BUCKET=my-frontend ./scripts/deploy_frontend_to_minio.sh
```

Note: MinIO can serve the static files, but direct browser refresh on deep SPA routes such as `/collections/...` still needs a reverse proxy fallback to `index.html`. Without that, open the MinIO `index.html` URL first and navigate inside the app.

For current production, prefer `docker-compose.prod.yml` with Nginx instead of serving the frontend from MinIO.

## Useful API Examples

### Login as Admin

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

### Get Products

```bash
curl http://localhost:8000/api/products/
```

### Track an Order

```bash
curl "http://localhost:8000/api/orders/track?orderNumber=FS02050&email=customer@example.com"
```

### Upload Product Image

```bash
curl -X POST http://localhost:8000/api/admin/uploads/products \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/image.png"
```

## Troubleshooting

### Run Docker Offline

`./start.sh` starts existing local images and does not rebuild. This works offline after the images have been pulled/built once.

If local images are missing, run this once while online:

```bash
./start.sh --build
```

To move images to an offline machine:

```bash
docker save mongo:6.0 minio/minio:latest redis:7-alpine fashion-store-backend:latest fashion-store-frontend:latest -o fashion-store-images.tar
docker load -i fashion-store-images.tar
```

### Services won’t start

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### View logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
docker compose logs -f minio
docker compose logs -f redis
```

### Port already in use

If ports `5173`, `8000`, `9000`, or `9001` are busy, stop the conflicting service or change port mappings in `docker-compose.yml`.

## Notes

- MongoDB credentials: `admin / admin`
- MinIO credentials: `minioadmin / minioadmin123`
- Redis is cache only and runs internally on Docker network
- Change `SECRET_KEY` in production
- Update `CORS_ORIGINS` for production deployment
- Use `docker-compose.prod.yml` + Nginx for host production deployment
- The most up-to-date handoff doc is `docs/technical-handoff.html`
