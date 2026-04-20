from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProductImageUploadResponse(BaseModel):
    url: str
    object_name: str
    content_type: str
    size: int


class ProductImageAsset(ProductImageUploadResponse):
    last_modified: Optional[datetime] = None
    product_usage_count: int = 0


class ProductVariant(BaseModel):
    id: str
    size: str = "One Size"
    color: str = ""
    sku: str = ""
    stock: int = Field(default=0, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    isActive: bool = True


class ProductWriteBase(BaseModel):
    slug: str = Field(..., min_length=2, max_length=160)
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    collectionSlug: str = Field(..., min_length=2, max_length=120)
    collectionSlugs: List[str] = Field(default_factory=list)
    price: float = Field(..., ge=0)
    compareAtPrice: Optional[float] = Field(default=None, ge=0)
    coverImage: str = ""
    images: List[str] = []
    variants: List[ProductVariant] = []
    styleTags: List[str] = []
    material: str = ""
    fitNotes: str = ""
    seoTitle: str = ""
    seoDescription: str = ""
    status: Literal["active", "draft"] = "active"
    isNew: bool = False
    isBestSeller: bool = False
    isOnSale: bool = False
    trendingScore: int = Field(default=0, ge=0, le=100)
    sku: str = ""
    translations: Dict[str, Any] = Field(default_factory=dict)


class ProductCreate(ProductWriteBase):
    pass


class ProductUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=2, max_length=160)
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10)
    collectionSlug: Optional[str] = Field(default=None, min_length=2, max_length=120)
    collectionSlugs: Optional[List[str]] = None
    price: Optional[float] = Field(default=None, ge=0)
    compareAtPrice: Optional[float] = Field(default=None, ge=0)
    coverImage: Optional[str] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariant]] = None
    styleTags: Optional[List[str]] = None
    material: Optional[str] = None
    fitNotes: Optional[str] = None
    seoTitle: Optional[str] = None
    seoDescription: Optional[str] = None
    status: Optional[Literal["active", "draft"]] = None
    isNew: Optional[bool] = None
    isBestSeller: Optional[bool] = None
    isOnSale: Optional[bool] = None
    trendingScore: Optional[int] = Field(default=None, ge=0, le=100)
    sku: Optional[str] = None
    translations: Optional[Dict[str, Any]] = None


class Product(ProductWriteBase):
    id: str
    category: str = ""
    categories: List[str] = Field(default_factory=list)
    stock: int = Field(default=0, ge=0)
    sizes: List[str] = []
    colors: List[str] = []
    created_at: datetime
    updated_at: datetime


class CatalogCollectionBase(BaseModel):
    slug: str = Field(..., min_length=2, max_length=120)
    title: str = Field(..., min_length=1, max_length=160)
    description: str = Field(..., min_length=10)
    featuredKeywords: List[str] = []
    seoHeading: str = ""
    seoBody: str = ""
    sortPriority: int = Field(default=99, ge=0)
    isActive: bool = True
    translations: Dict[str, Any] = Field(default_factory=dict)


class CatalogCollectionCreate(CatalogCollectionBase):
    pass


class CatalogCollectionUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=2, max_length=120)
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = Field(default=None, min_length=10)
    featuredKeywords: Optional[List[str]] = None
    seoHeading: Optional[str] = None
    seoBody: Optional[str] = None
    sortPriority: Optional[int] = Field(default=None, ge=0)
    isActive: Optional[bool] = None
    translations: Optional[Dict[str, Any]] = None


class CatalogCollection(CatalogCollectionBase):
    id: str
    created_at: datetime
    updated_at: datetime


class CatalogImportRequest(BaseModel):
    collections: List[CatalogCollectionCreate] = []
    products: List[ProductCreate] = []


class CatalogImportResponse(BaseModel):
    collections_upserted: int
    products_upserted: int


class SiteContentBundleBase(BaseModel):
    siteChrome: Dict[str, Any] = Field(default_factory=dict)
    homePageContent: Dict[str, Any] = Field(default_factory=dict)
    merchandisingPages: Dict[str, Any] = Field(default_factory=dict)
    editorialPages: Dict[str, Any] = Field(default_factory=dict)
    infoPages: Dict[str, Any] = Field(default_factory=dict)
    locales: Dict[str, Any] = Field(default_factory=dict)


class SiteContentImportRequest(SiteContentBundleBase):
    pass


class SiteContentBundle(SiteContentBundleBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)
    variant_id: Optional[str] = None
    variant_sku: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)
    variant_id: Optional[str] = None
    variant_sku: Optional[str] = None


class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)
    size: str = "One Size"
    color: Optional[str] = None
    price: float = Field(default=0, ge=0)
    product_name: str = ""
    image: str = ""
    category: str = ""
    slug: str = ""
    variant_id: Optional[str] = None
    variant_sku: Optional[str] = None
    max_quantity: int = Field(default=0, ge=0)
    available: bool = True


class Cart(BaseModel):
    user_id: str
    items: List[CartItem] = []
    subtotal_amount: float = Field(default=0, ge=0)
    shipping_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    created_at: datetime
    updated_at: datetime


class WishlistItemCreate(BaseModel):
    product_id: str


class Wishlist(BaseModel):
    user_id: str
    items: List[Product] = []
    created_at: datetime
    updated_at: datetime


class OrderStatus(str, Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderTrackingStep(BaseModel):
    label: str
    active: bool
    detail: str = ""
    timestamp: Optional[datetime] = None


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    size: str
    color: Optional[str] = None
    image: str = ""
    variant_id: Optional[str] = None
    variant_sku: Optional[str] = None


class CheckoutCustomer(BaseModel):
    fullName: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=30)
    country: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)
    postalCode: str = ""


class CheckoutItem(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)
    variant_id: Optional[str] = None
    variant_sku: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[CheckoutItem]
    customer: CheckoutCustomer
    payment_method: str


class Order(BaseModel):
    id: str
    orderNumber: str
    user_id: Optional[str] = None
    email: str
    items: List[OrderItem]
    subtotal_amount: float = 0
    shipping_amount: float = 0
    total_amount: float
    status: OrderStatus = OrderStatus.PENDING
    shipping_address: str
    contact_phone: str = ""
    payment_method: str
    trackingSteps: List[OrderTrackingStep] = []
    created_at: datetime
    updated_at: datetime


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class User(UserBase):
    id: str = Field(alias="_id")
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
