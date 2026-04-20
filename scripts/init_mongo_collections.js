const databaseName = process.env.DATABASE_NAME || db.getName() || "fashion_store";
const targetDb = db.getSiblingDB(databaseName);

function log(message) {
  print(`[init-mongo] ${message}`);
}

function ensureCollection(name, validator) {
  const existing = targetDb.getCollectionNames().includes(name);

  if (!existing) {
    targetDb.createCollection(name, { validator });
    log(`created collection: ${name}`);
    return;
  }

  targetDb.runCommand({
    collMod: name,
    validator,
    validationLevel: "moderate",
  });
  log(`updated validator: ${name}`);
}

function ensureIndex(collectionName, keys, options = {}) {
  const collection = targetDb.getCollection(collectionName);
  if (options.name) {
    const existingByName = collection.getIndexes().find((index) => index.name === options.name);
    if (existingByName) {
      log(`index name already present on ${collectionName}: ${options.name}`);
      return;
    }
  }

  const wantsTextIndex = Object.values(keys).some((value) => value === "text");
  if (wantsTextIndex) {
    const existingTextIndex = collection.getIndexes().find((index) => Boolean(index.weights));
    if (existingTextIndex) {
      log(`text index already present on ${collectionName}: ${existingTextIndex.name}`);
      return;
    }
  }

  const normalizedKeys = JSON.stringify(keys);
  const existing = collection
    .getIndexes()
    .find((index) => JSON.stringify(index.key) === normalizedKeys);

  if (existing) {
    log(`index already present on ${collectionName}: ${existing.name}`);
    return;
  }

  try {
    collection.createIndex(keys, options);
    log(`created index on ${collectionName}: ${JSON.stringify(keys)}`);
  } catch (error) {
    if (
      String(error).includes("IndexOptionsConflict") ||
      String(error).includes("IndexKeySpecsConflict")
    ) {
      log(`index conflict skipped on ${collectionName}: ${JSON.stringify(keys)}`);
      return;
    }
    throw error;
  }
}

ensureCollection("users", {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "username", "full_name", "password", "is_admin", "is_active", "created_at"],
    properties: {
      email: { bsonType: "string" },
      username: { bsonType: "string" },
      full_name: { bsonType: "string" },
      password: { bsonType: "string" },
      phone: { bsonType: "string" },
      is_admin: { bsonType: "bool" },
      is_active: { bsonType: "bool" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
      last_login_at: { bsonType: "date" },
    },
  },
});

ensureCollection("catalog_collections", {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "title", "description", "sortPriority", "isActive", "created_at", "updated_at"],
    properties: {
      slug: { bsonType: "string" },
      title: { bsonType: "string" },
      description: { bsonType: "string" },
      featuredKeywords: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      seoHeading: { bsonType: "string" },
      seoBody: { bsonType: "string" },
      sortPriority: { bsonType: ["int", "long", "double"] },
      isActive: { bsonType: "bool" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("products", {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "name", "description", "collectionSlug", "price", "status", "images", "variants", "created_at", "updated_at"],
    properties: {
      slug: { bsonType: "string" },
      sku: { bsonType: "string" },
      name: { bsonType: "string" },
      description: { bsonType: "string" },
      category: { bsonType: "string" },
      categories: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      collectionSlug: { bsonType: "string" },
      collectionSlugs: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      price: { bsonType: ["int", "long", "double", "decimal"] },
      compareAtPrice: { bsonType: ["int", "long", "double", "decimal", "null"] },
      coverImage: { bsonType: "string" },
      images: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      variants: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["id", "size", "stock"],
          properties: {
            id: { bsonType: "string" },
            size: { bsonType: "string" },
            color: { bsonType: "string" },
            sku: { bsonType: "string" },
            stock: { bsonType: ["int", "long", "double"] },
            price: { bsonType: ["int", "long", "double", "decimal", "null"] },
            isActive: { bsonType: "bool" },
          },
        },
      },
      styleTags: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      material: { bsonType: "string" },
      fitNotes: { bsonType: "string" },
      isNew: { bsonType: "bool" },
      isBestSeller: { bsonType: "bool" },
      isOnSale: { bsonType: "bool" },
      trendingScore: { bsonType: ["int", "long", "double"] },
      status: { enum: ["active", "draft"] },
      seoTitle: { bsonType: "string" },
      seoDescription: { bsonType: "string" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("site_content", {
  $jsonSchema: {
    bsonType: "object",
    required: ["key", "siteChrome", "homePageContent", "merchandisingPages", "editorialPages", "infoPages", "created_at", "updated_at"],
    properties: {
      key: { bsonType: "string" },
      siteChrome: { bsonType: "object" },
      homePageContent: { bsonType: "object" },
      merchandisingPages: { bsonType: "object" },
      editorialPages: { bsonType: "object" },
      infoPages: { bsonType: "object" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("carts", {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "items", "created_at", "updated_at"],
    properties: {
      user_id: { bsonType: "string" },
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["product_id", "quantity", "size"],
          properties: {
            product_id: { bsonType: "string" },
            quantity: { bsonType: ["int", "long", "double"] },
            size: { bsonType: "string" },
            color: { bsonType: "string" },
            variant_id: { bsonType: ["string", "null"] },
            variant_sku: { bsonType: ["string", "null"] },
            price_snapshot: { bsonType: ["int", "long", "double", "decimal"] },
            product_name_snapshot: { bsonType: "string" },
            image_snapshot: { bsonType: "string" },
            category_snapshot: { bsonType: "string" },
            slug_snapshot: { bsonType: "string" },
          },
        },
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("wishlists", {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "items", "created_at", "updated_at"],
    properties: {
      user_id: { bsonType: "string" },
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["product_id", "added_at"],
          properties: {
            product_id: { bsonType: "string" },
            added_at: { bsonType: "date" },
          },
        },
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("orders", {
  $jsonSchema: {
    bsonType: "object",
    required: ["orderNumber", "email", "items", "total_amount", "status", "payment_method", "trackingSteps", "created_at", "updated_at"],
    properties: {
      orderNumber: { bsonType: "string" },
      user_id: { bsonType: ["string", "null"] },
      email: { bsonType: "string" },
      status: { bsonType: "string" },
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["product_id", "product_name", "quantity", "price", "size"],
          properties: {
            product_id: { bsonType: "string" },
            product_name: { bsonType: "string" },
            quantity: { bsonType: ["int", "long", "double"] },
            price: { bsonType: ["int", "long", "double", "decimal"] },
            size: { bsonType: "string" },
            color: { bsonType: "string" },
            image: { bsonType: "string" },
            variant_id: { bsonType: ["string", "null"] },
            variant_sku: { bsonType: ["string", "null"] },
          },
        },
      },
      subtotal_amount: { bsonType: ["int", "long", "double", "decimal"] },
      shipping_amount: { bsonType: ["int", "long", "double", "decimal"] },
      discount_amount: { bsonType: ["int", "long", "double", "decimal"] },
      total_amount: { bsonType: ["int", "long", "double", "decimal"] },
      currency: { bsonType: "string" },
      shipping_address: { bsonType: ["string", "object"] },
      payment_method: { bsonType: "string" },
      payment_status: { bsonType: "string" },
      trackingSteps: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["label", "active"],
          properties: {
            label: { bsonType: "string" },
            active: { bsonType: "bool" },
            detail: { bsonType: "string" },
            timestamp: { bsonType: ["date", "null"] },
          },
        },
      },
      notes: { bsonType: "string" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("product_reviews", {
  $jsonSchema: {
    bsonType: "object",
    required: ["product_id", "rating", "is_published", "created_at", "updated_at"],
    properties: {
      product_id: { bsonType: "string" },
      user_id: { bsonType: "string" },
      order_id: { bsonType: "string" },
      rating: { bsonType: ["int", "long", "double"] },
      title: { bsonType: "string" },
      body: { bsonType: "string" },
      reviewer_name: { bsonType: "string" },
      is_verified_purchase: { bsonType: "bool" },
      is_published: { bsonType: "bool" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("newsletter_subscribers", {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "is_active", "subscribed_at"],
    properties: {
      email: { bsonType: "string" },
      source: { bsonType: "string" },
      locale: { bsonType: "string" },
      is_active: { bsonType: "bool" },
      subscribed_at: { bsonType: "date" },
      unsubscribed_at: { bsonType: "date" },
    },
  },
});

ensureCollection("editorial_pages", {
  $jsonSchema: {
    bsonType: "object",
    required: ["type", "slug", "title", "description", "is_active", "created_at", "updated_at"],
    properties: {
      type: { bsonType: "string" },
      slug: { bsonType: "string" },
      title: { bsonType: "string" },
      eyebrow: { bsonType: "string" },
      description: { bsonType: "string" },
      hero_image: { bsonType: "string" },
      bullets: {
        bsonType: "array",
        items: { bsonType: "string" },
      },
      cta: {
        bsonType: "object",
        properties: {
          label: { bsonType: "string" },
          to: { bsonType: "string" },
        },
      },
      related_collection_slug: { bsonType: "string" },
      is_active: { bsonType: "bool" },
      published_at: { bsonType: "date" },
      seo_title: { bsonType: "string" },
      seo_description: { bsonType: "string" },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureIndex("users", { email: 1 }, { unique: true, name: "uq_users_email" });
ensureIndex("users", { username: 1 }, { unique: true, name: "uq_users_username" });
ensureIndex("users", { is_admin: 1, is_active: 1 }, { name: "idx_users_admin_active" });

ensureIndex("catalog_collections", { slug: 1 }, { unique: true, name: "uq_catalog_collections_slug" });
ensureIndex("catalog_collections", { isActive: 1, sortPriority: 1 }, { name: "idx_catalog_collections_active_priority" });

ensureIndex("products", { slug: 1 }, { unique: true, sparse: true, name: "uq_products_slug" });
ensureIndex("products", { category: 1 }, { name: "idx_products_category" });
ensureIndex("products", { categories: 1 }, { name: "idx_products_categories" });
ensureIndex("products", { collectionSlug: 1 }, { sparse: true, name: "idx_products_collection_slug" });
ensureIndex("products", { collectionSlugs: 1 }, { name: "idx_products_collection_slugs" });
ensureIndex("products", { price: 1 }, { name: "idx_products_price" });
ensureIndex("products", { created_at: -1 }, { name: "idx_products_created_at_desc" });
ensureIndex("products", { status: 1, collectionSlug: 1, created_at: -1 }, { name: "idx_products_status_collection_created" });
ensureIndex("products", { status: 1, collectionSlugs: 1, created_at: -1 }, { name: "idx_products_status_collection_slugs_created" });
ensureIndex("products", { isBestSeller: 1, created_at: -1 }, { name: "idx_products_best_seller" });
ensureIndex("products", { isNew: 1, created_at: -1 }, { name: "idx_products_new" });
ensureIndex("products", { isOnSale: 1, price: 1 }, { name: "idx_products_sale" });
ensureIndex("products", { trendingScore: -1 }, { name: "idx_products_trending" });
ensureIndex("products", { name: "text", description: "text" }, { name: "text_products_search" });

ensureIndex("site_content", { key: 1 }, { unique: true, name: "uq_site_content_key" });

ensureIndex("carts", { user_id: 1 }, { unique: true, name: "uq_carts_user_id" });
ensureIndex("carts", { updated_at: -1 }, { name: "idx_carts_updated_at_desc" });

ensureIndex("wishlists", { user_id: 1 }, { unique: true, name: "uq_wishlists_user_id" });

ensureIndex("orders", { orderNumber: 1 }, { unique: true, sparse: true, name: "uq_orders_order_number" });
ensureIndex("orders", { user_id: 1, created_at: -1 }, { name: "idx_orders_user_created_desc" });
ensureIndex("orders", { status: 1, created_at: -1 }, { name: "idx_orders_status_created_desc" });
ensureIndex("orders", { email: 1, created_at: -1 }, { sparse: true, name: "idx_orders_email_created_desc" });

ensureIndex("product_reviews", { product_id: 1, is_published: 1, created_at: -1 }, { name: "idx_reviews_product_published_created" });
ensureIndex("product_reviews", { product_id: 1, user_id: 1 }, { unique: true, sparse: true, name: "uq_reviews_product_user" });

ensureIndex("newsletter_subscribers", { email: 1 }, { unique: true, name: "uq_newsletter_email" });
ensureIndex("newsletter_subscribers", { is_active: 1, subscribed_at: -1 }, { name: "idx_newsletter_active_subscribed_desc" });

ensureIndex("editorial_pages", { type: 1, slug: 1 }, { unique: true, name: "uq_editorial_pages_type_slug" });
ensureIndex("editorial_pages", { is_active: 1, published_at: -1 }, { name: "idx_editorial_pages_active_published_desc" });

log(`database ready: ${databaseName}`);
