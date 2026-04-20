import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_db, close_db
from redis_client import close_redis, connect_redis
from routes import products, cart, orders, auth, admin, content, admin_content, wishlist

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    connect_db()
    print("✅ Connected to MongoDB")
    connect_redis()
    yield
    # Shutdown
    close_redis()
    close_db()
    print("❌ Disconnected from MongoDB")

# Initialize FastAPI app
app = FastAPI(title="Fashion Store API", version="1.0.0", lifespan=lifespan)


def get_cors_origins():
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(content.router, prefix="/api/content", tags=["Content"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(wishlist.router, prefix="/api/wishlist", tags=["Wishlist"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_content.router, prefix="/api/admin/content", tags=["Admin Content"])

@app.get("/")
async def root():
    return {"message": "Fashion Store API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
