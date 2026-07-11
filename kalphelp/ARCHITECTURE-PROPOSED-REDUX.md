# NestCraft Living — Proposed Architecture (Redux Toolkit Centric)

> **Date:** July 2026
> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Redux Toolkit · MongoDB

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Architecture Overview](#3-proposed-architecture-overview)
4. [Redux Toolkit Strategy: RTK Query + Traditional Slices](#4-redux-toolkit-strategy-rtk-query--traditional-slices)
5. [Data Fetching Standards](#5-data-fetching-standards)
6. [Page Architecture (Server Component First)](#6-page-architecture-server-component-first)
7. [API Route Architecture](#7-api-route-architecture)
8. [Layout Architecture](#8-layout-architecture)
9. [Directory Structure](#9-directory-structure)
10. [SEO Requirements](#10-seo-requirements)
11. [Critical Gaps to Address](#11-critical-gaps-to-address)
12. [Migration Phases](#12-migration-phases)
13. [Files to Delete / Consolidate](#13-files-to-delete--consolidate)
14. [Key Wins Summary](#14-key-wins-summary)
15. [Appendix: Current vs Proposed Comparison](#15-appendix-current-vs-proposed-comparison)

---

## 1. Current State Summary

| Property | Value |
|----------|-------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui |
| **State** | Redux Toolkit — 18 slices, 15+ thunks |
| **Database** | MongoDB (native driver, no Mongoose) |
| **Backend** | Dual: Next.js API routes (direct MongoDB) + FastAPI proxy |
| **Auth** | Dual: FastAPI `/auth/*` (client login) + Next.js `/api/login` (server). JWT in `auth_token` httpOnly cookie |
| **CMS** | Headless (page blocks stored in MongoDB, served via FastAPI) |

**Current data flow:**
- **Server-side:** `getPageData()` → `React.cache()` → `fetch()` → FastAPI
- **Client-side:** Redux thunks → `fetch()` → FastAPI (or Next.js API routes)
- **Layout-level:** `<FetchAllData />` in layout fires 10+ thunks on every navigation
- **GetAllDetails/ components:** 8 components that dispatch thunks at layout level — all `"use client"`

**Current store (18 slices):**
```
auth, pages, menus, comments, cart, forms,
adminProducts, adminCategories, adminAttributes,
adminVariants, adminOrders, wishlist, orders,
websiteDetail, adminUsers, adminForms,
branding, businessBlueprint
```

---

## 2. Problem Statement

| Problem | Impact |
|---------|--------|
| **24 of 36 pages are client components** | Unnecessary JS bundle, poor SEO, slower LCP |
| **Layout-level data prefetch** (`<FetchAllData/>`, `Providers.tsx`) | Waterfall requests, every page fetches everything |
| **18 Redux slices loaded at all times** | Large bundle, complex state tree |
| **15+ hand-written thunks** | Repetitive boilerplate, manual loading/error handling |
| **Dual backend (FastAPI + Next.js)** | Dual auth paths, inconsistent patterns, proxy complexity |
| **No `loading.tsx` / `error.tsx`** on most routes | Poor UX, no skeleton loaders, uncaught errors crash page |
| **Inconsistent SEO metadata** | Only 3 pages have `generateMetadata` |
| **No order persistence** | Checkout is a UI prototype — no real orders |
| **Flat file organization** | `components/pages/` has 18 mixed server/client files |

---

## 3. Proposed Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js 15 App Router                      │
├──────────────────────────┬──────────────────────────────────────┤
│    PUBLIC STOREFRONT     │             ADMIN PANEL              │
│                          │                                      │
│  ┌──────────────────┐   │  ┌──────────────────────────────┐    │
│  │ Server Pages      │   │  │ Auth Gate (server check)    │    │
│  │ (no "use client") │   │  │ → Sidebar + Header + CRUD   │    │
│  │                    │   │  │ → Admin Redux slices        │    │
│  │ generateMetadata  │   │  └──────────────────────────────┘    │
│  │ loading.tsx       │   │                                      │
│  │ error.tsx         │   │                                      │
│  └────────┬─────────┘   │                                      │
│           │             │                                      │
│  ┌────────┴─────────┐   │                                      │
│  │ Client Leaf Comps │   │                                      │
│  │ (interactive only)│   │                                      │
│  └────────┬─────────┘   │                                      │
│           │             │                                      │
├───────────┴─────────────┴──────────────────────────────────────┤
│                     Redux Toolkit Store                          │
│  ┌─────────────────────┐  ┌────────────────────────────────┐   │
│  │ RTK Query API slices│  │ Traditional Slices + Admin     │   │
│  │ (4 slices, auto)    │  │ (13 slices, manual thunks)     │   │
│  └─────────────────────┘  └────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                   Service Layer (lib/services/)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ MongoDB   │  │ FastAPI  │  │ Payment  │  │ External APIs │  │
│  │ (direct)  │  │ (legacy) │  │ Gateway  │  │               │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Every public page is a Server Component** — No `"use client"` at page level
2. **RTK Query for all server-state** — Zero hand-written thunks for public data
3. **Traditional slices for client-state only** — Auth, CMS editing, UI state
4. **Admin stays as-is** — All 7 admin slices remain untouched
5. **Single data fetching pattern** — Server: `React.cache()` + `fetch()`. Client: RTK Query
6. **Every route has `loading.tsx` + `error.tsx`** — No exceptions
7. **Every public page exports `generateMetadata`** — For SEO
8. **Single `<StoreProvider>` at root** — No nested providers

---

## 4. Redux Toolkit Strategy: RTK Query + Traditional Slices

### 4.1 The Split

```
┌──────────────────────────────────────────────────────────┐
│                   Redux Toolkit Store                      │
├──────────────────────┬───────────────────┬───────────────┤
│  RTK Query           │ Traditional       │ Admin Slices   │
│  (auto-generated)    │ (manual)          │ (manual)       │
├──────────────────────┼───────────────────┼───────────────┤
│ productsApi          │ auth              │ adminProducts   │
│ cartApi              │ pages (CMS edit)  │ adminCategories │
│ ordersApi            │ menus             │ adminAttributes │
│ categoriesApi        │ branding (merged) │ adminVariants   │
│                      │ shoppingCart (UI) │ adminOrders     │
│                      │ comments          │ adminUsers      │
│                      │ forms             │ adminForms      │
│                      │                   │                │
│  4 API slices        │  7 slices         │ 7 slices       │
│  ZERO thunks         │  Keep existing    │ Keep existing   │
└──────────────────────┴───────────────────┴───────────────┘
```

**Total: 18 slices → ~14 slices** (4 RTK Query + 7 traditional + 7 admin)

### 4.2 RTK Query API Slices (New)

RTK Query (`createApi` + `fetchBaseQuery`) replaces **all public-facing thunks**. It is part of `@reduxjs/toolkit` — already in `package.json`, no new dependency.

#### `productsApi` — Replaces:
- `lib/store/products/productsThunk.ts`
- `lib/store/products/productsSlices.ts`
- `lib/GetAllDetails/GetAllProducts.tsx`
- `lib/GetAllDetails/GetSingleProduct.tsx`
- `lib/GetAllDetails/GetProductCategoryWise.tsx`

```typescript
// lib/store/api/productsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ProductsFilterParams {
  search?: string;
  categoryIds?: string[];
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "name_asc";
  minPrice?: number;
  maxPrice?: number;
}

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Product", "Products"],
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductsFilterParams>({
      query: (params) => ({ url: "/products", params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((p) => ({ type: "Product" as const, id: p._id })), "Products"]
          : ["Products"],
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `/products/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Product", id: slug }],
    }),
    getRelatedProducts: builder.query<Product[], { productId: string; limit?: number }>({
      query: (params) => ({ url: "/products/related", params }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetRelatedProductsQuery,
} = productsApi;
```

**Auto-generated hooks provide:** `isLoading`, `isFetching`, `isError`, `error`, `data`, `refetch` — no manual state management.

#### `cartApi` — Replaces:
- `lib/store/cart/cartThunk.ts`
- `lib/GetAllDetails/GetCart.tsx`

```typescript
// lib/store/api/cartApi.ts
export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    getCart: builder.query<CartItem[], void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation<CartResponse, AddToCartPayload>({
      query: (body) => ({ url: "/cart", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: builder.mutation<CartResponse, { cartItemId: string; quantity: number }>({
      query: ({ cartItemId, quantity }) => ({
        url: "/cart",
        method: "PUT",
        body: { cartItemId, quantity },
      }),
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: builder.mutation<CartResponse, { cartItemId?: string; clear?: boolean }>({
      query: (body) => ({ url: "/cart", method: "DELETE", body }),
      invalidatesTags: ["Cart"],
    }),
  }),
});
```

The old `cartSlice` is **reduced to a `shoppingCartSlice`** for UI-only state (drawer open/close, selected item for quick view) — actual cart data comes from RTK Query.

#### `ordersApi` — Replaces:
- `lib/store/orders/ordersThunk.ts`
- `lib/store/orders/ordersSlice.ts`

```typescript
// lib/store/api/ordersApi.ts
export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Orders", "Order"],
  endpoints: (builder) => ({
    getOrders: builder.query<PaginatedResponse<Order>, { page?: number; limit?: number }>({
      query: (params) => ({ url: "/orders", params }),
      providesTags: ["Orders"],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    createOrder: builder.mutation<OrderResponse, CheckoutPayload>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Cart", "Orders"],
    }),
  }),
});
```

#### `categoriesApi` — Replaces:
- `lib/GetAllDetails/GetAllCategories.tsx`
- `lib/store/categories/categoriesThunk.ts`

```typescript
// lib/store/api/categoriesApi.ts
export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], { type?: string; parentId?: string }>({
      query: (params) => ({ url: "/categories", params }),
      providesTags: ["Categories"],
    }),
    getCategoryBySlug: builder.query<Category, string>({
      query: (slug) => `/categories/${slug}`,
    }),
  }),
});
```

### 4.3 Traditional Redux Slices (Keep as `createSlice`)

These remain as traditional Redux Toolkit slices because they manage **client-only state**, not server data:

| Slice | Purpose | Action |
|-------|---------|--------|
| **auth** | User session, login/logout, JWT | Keep as-is. Server hydration via `<GetUser>` |
| **pages** | CMS page editing state | Keep as-is. Used by annotation plugin |
| **menus** | Navigation menus | Keep as-is. Simple cache |
| **shoppingCart** (rename from `cart`) | UI state only: drawer open/close, selected options | **Reduce:** remove server-data fields, keep only UI concerns |
| **branding** (merged) | Brand config, business blueprint, website detail | **Merge:** combine `branding` + `websiteDetail` + `businessBlueprint` into one slice |
| **comments** | Annotation plugin state | Keep as-is |
| **forms** | Dynamic form definitions | Keep as-is |

### 4.4 Admin Slices (Keep Untouched)

All 7 admin slices remain exactly as they are:
- `adminProducts` (from `features/adminProductsSlice.ts`)
- `adminCategories` (from `features/adminCategoriesSlice.ts`)
- `adminAttributes` (from `features/adminAttributesSlice.ts`)
- `adminVariants` (from `features/adminVariantsSlice.ts`)
- `adminOrders` (from `features/adminOrdersSlice.ts`)
- `adminUsers` (from `users/userSlice.tsx`)
- `adminForms` (from `forms/formsSlice.ts`)

### 4.5 Proposed Store Configuration

```typescript
// lib/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { productsApi } from "./api/productsApi";
import { cartApi } from "./api/cartApi";
import { ordersApi } from "./api/ordersApi";
import { categoriesApi } from "./api/categoriesApi";

import authReducer from "./auth/authSlice";
import pagesReducer from "./pages/pagesSlice";
import menusReducer from "./menus/menusSlice";
import brandingReducer from "./branding/brandingSlice";   // merged
import shoppingCartReducer from "./shoppingCart/shoppingCartSlice"; // UI-only
import commentsReducer from "./comments/commentSlice";
import formsReducer from "./forms/formsSlice";

// Admin slices (untouched)
import adminProductsReducer from "./features/adminProductsSlice";
import adminCategoriesReducer from "./features/adminCategoriesSlice";
import adminAttributesReducer from "./features/adminAttributesSlice";
import adminVariantsReducer from "./features/adminVariantsSlice";
import adminOrdersReducer from "./features/adminOrdersSlice";
import adminUsersReducer from "./users/userSlice";
import adminFormsReducer from "./forms/formsSlice";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // RTK Query API slices
      [productsApi.reducerPath]: productsApi.reducer,
      [cartApi.reducerPath]: cartApi.reducer,
      [ordersApi.reducerPath]: ordersApi.reducer,
      [categoriesApi.reducerPath]: categoriesApi.reducer,

      // Traditional slices
      auth: authReducer,
      pages: pagesReducer,
      menus: menusReducer,
      branding: brandingReducer,
      shoppingCart: shoppingCartReducer,
      comments: commentsReducer,
      forms: formsReducer,

      // Admin CRUD (untouched)
      adminProducts: adminProductsReducer,
      adminCategories: adminCategoriesReducer,
      adminAttributes: adminAttributesReducer,
      adminVariants: adminVariantsReducer,
      adminOrders: adminOrdersReducer,
      adminUsers: adminUsersReducer,
      adminForms: adminFormsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        productsApi.middleware,
        cartApi.middleware,
        ordersApi.middleware,
        categoriesApi.middleware,
      ),
  });

  setupListeners(store.dispatch); // enables refetchOnFocus/refetchOnReconnect
  return store;
};
```

---

## 5. Data Fetching Standards

### 5.1 Data Fetching Rules

| Scenario | Where | Mechanism |
|----------|-------|-----------|
| Initial page data | **Server** (page.tsx) | `React.cache()` + `fetch()` with `next: { revalidate }` |
| Product list, categories | **Client** (via RTK Query) | `useGetProductsQuery(params)` — auto-cached |
| Cart, orders | **Client** (via RTK Query) | `useGetCartQuery()`, `useGetOrdersQuery()` |
| Mutations (add to cart, checkout) | **Client** (via RTK Query) | `useAddToCartMutation()` — auto `invalidatesTags` |
| Admin CRUD | **Client** (via Redux thunks) | Keep existing `createAsyncThunk` pattern |
| SEO metadata | **Server** (page.tsx) | Server fetch → `generateMetadata` |

### 5.2 Server-Side Fetch (in page.tsx)

```typescript
// lib/services/page.ts
import { cache } from "react";

export const getPageData = cache(async (slug: string) => {
  const res = await fetch(`${API_URL}/cms/pages?slug=${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
});

export const getPageMetadata = cache(async (slug: string) => {
  const data = await getPageData(slug);
  return {
    title: data?.metaTitle?.en ?? "NestCraft Living",
    description: data?.metaDescription?.en ?? "Design-led furniture for modern homes",
    openGraph: {
      title: data?.metaTitle?.en,
      description: data?.metaDescription?.en,
    },
  };
});
```

### 5.3 Client-Side (RTK Query — usage in components)

```typescript
"use client";
import { useGetProductsQuery } from "@/lib/store/api/productsApi";

export function ProductGrid() {
  const { data, isLoading, isError, error, isFetching } = useGetProductsQuery({
    page: 1,
    limit: 20,
    sort: "newest",
  });

  if (isLoading) return <ProductGridSkeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.data.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
      <Pagination total={data.total} page={data.page} />
    </div>
  );
}
```

### 5.4 Caching Rules

| Endpoint | Strategy | `revalidate` | Notes |
|----------|----------|-------------|-------|
| Home, About, Services | **ISR** | 3600 (1 hour) | Static content, rarely changes |
| Shop, Category pages | **ISR** | 60 (1 min) | Products change often |
| Product detail | **ISR** | 300 (5 min) | Price/inventory changes |
| Blog | **ISR** | 300 (5 min) | |
| Cart | **No-cache** (RTK Query) | — | Always fresh |
| Orders | **No-cache** (RTK Query) | — | Always fresh |
| API routes (GET) | **`Cache-Control: public, s-maxage=60`** | — | Add to all GET responses |

---

## 6. Page Architecture (Server Component First)

### 6.1 Page Pattern (Every Page)

```
app/[locale]/
├── page.tsx               # Server Component — fetch data + generateMetadata
├── loading.tsx            # Skeleton loader (always required)
├── error.tsx              # Error boundary (always required)
└── _components/           # Page-specific client components (when needed)
```

### 6.2 Public Page Conversion Plan

| Page | Current Type | Proposed Type | Key Change |
|------|-------------|---------------|------------|
| Home | Mixed | **Server** | Already partially server. Ensure `generateMetadata` |
| About | Mixed | **Server** | Already partially server. Ensure `generateMetadata` |
| Shop | **Client** | **Server** | Move data fetch to `useGetProductsQuery` in client leaf |
| Category/[id] | **Client** | **Server** | Same as Shop |
| Product/[id] | Mixed | **Server** | Move variant/add-to-cart to leaf components |
| Cart | **Client** | **Server** | Shell server → `useGetCartQuery` in leaf |
| Checkout | **Client** | **Server** | Shell server → checkout form leaf |
| Login | **Client** | **Server** | Shell server → `LoginFormSection` leaf |
| Signup | **Client** | **Server** | Shell server → signup form leaf |
| Account | — (stub) | **Server** | New page. Check auth → render profile |
| Orders | — (stub) | **Server** | New page. `useGetOrdersQuery` |
| Orders/[id] | — (stub) | **Server** | New page. `useGetOrderByIdQuery` |
| Wishlist | — (stub) | **Server** | New page. RTK Query fetch |
| Blog | **Client** | **Server** | Server fetch CMS data |
| Contact | **Client** | **Server** | Server shell → client form leaf |
| Services | **Client** | **Server** | Server fetch CMS data |
| FAQ | **Client** | **Server** | Server fetch CMS data |

### 6.3 Server Component Template

```typescript
// app/[locale]/shop/page.tsx — Server Component
import { Suspense } from "react";
import { getPageMetadata } from "@/lib/services/page";

export async function generateMetadata() {
  return getPageMetadata("shop");
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopPageClient />
    </Suspense>
  );
}

// ShopPageSkeleton is a server-compatible loading state
function ShopPageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse h-96 bg-muted rounded-2xl" />
      ))}
    </div>
  );
}
```

### 6.4 Client Leaf Component Template

```typescript
// app/[locale]/shop/_components/ShopPageClient.tsx
"use client";
import { useGetProductsQuery } from "@/lib/store/api/productsApi";

export function ShopPageClient() {
  const { data, isLoading, error } = useGetProductsQuery({
    page: 1,
    limit: 20,
  });

  if (isLoading) return <ProductGridSkeleton />;
  if (error) return <ErrorSection error={error} />;

  return (
    <div className="flex gap-8 p-8">
      <aside className="w-64 flex-shrink-0">
        <SidebarFilters />
      </aside>
      <div className="flex-1">
        <ProductGrid products={data.data} />
        <Pagination total={data.total} page={data.page} />
      </div>
    </div>
  );
}
```

---

## 7. API Route Architecture

### 7.1 Proposed Route Structure

```
app/api/
├── products/
│   ├── route.ts                  # GET (list/search/filter/paginate), POST (create)
│   ├── [id]/
│   │   └── route.ts              # GET (single), PUT (update), DELETE
│   ├── [id]/reviews/
│   │   └── route.ts              # GET (reviews), POST (add review)
│   └── related/
│       └── route.ts              # GET (related products)
├── categories/
│   ├── route.ts                  # GET (list), POST (create)
│   └── [slug]/
│       └── route.ts              # GET (single by slug)
├── cart/
│   ├── route.ts                  # GET (fetch), POST (add), PUT (update), DELETE (remove)
│   └── coupon/
│       └── route.ts              # POST (apply coupon)
├── orders/
│   ├── route.ts                  # GET (user's orders), POST (checkout/create)
│   └── [id]/
│       └── route.ts              # GET (single order detail)
├── wishlist/
│   └── route.ts                  # GET (fetch), POST (add), DELETE (remove)
├── auth/
│   ├── me/
│   │   └── route.ts              # GET (user profile)
│   ├── login/
│   │   └── route.ts              # POST (login)
│   └── register/
│       └── route.ts              # POST (signup)
├── contact/
│   └── route.ts                  # POST (contact form submission)
└── admin/                        # All admin CRUD under /api/admin namespace
    ├── products/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── categories/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── orders/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── users/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── attributes/
    │   └── route.ts
    └── upload/
        └── route.ts
```

### 7.2 Key Changes from Current

| Current (`app/api/ecommerce/*`) | Proposed (`app/api/*`) | Reason |
|---------------------------------|-----------------------|--------|
| `ecommerce/products` | `products` | Flatten — no need for `ecommerce` namespace |
| `ecommerce/cart` | `cart` | Shorter, clearer |
| `ecommerce/orders` | `orders` | Shorter, clearer |
| `ecommerce/categories` | `categories` | Shorter, clearer |
| `ecommerce/variants` | Merge into `products/[id]` | Variants are product-specific |
| `ecommerce/attributes` | Move to `admin/attributes` | Admin-only |
| `ecommerce/upload` | Move to `admin/upload` | Admin-only |
| `pages/*`, `[[...slug]]/*` | Move to `cms/*` | CMS is a distinct domain |

### 7.3 Standard API Response Envelope

Every API route should return a consistent shape:

```typescript
// Standard API response type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
```

### 7.4 API Route Template

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectTenantDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const db = await connectTenantDB();
    const products = db.collection("products");

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // $match stage (filters)
    const match: Record<string, any> = { status: "active" };
    if (search) match.name = { $regex: search, $options: "i" };
    if (categoryId) match.categoryIds = categoryId;
    if (minPrice || maxPrice) {
      match["pricing.price"] = {};
      if (minPrice) match["pricing.price"].$gte = parseFloat(minPrice);
      if (maxPrice) match["pricing.price"].$lte = parseFloat(maxPrice);
    }
    pipeline.push({ $match: match });

    // Sort stage
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      price_asc: { "pricing.price": 1 },
      price_desc: { "pricing.price": -1 },
      name_asc: { name: 1 },
    };
    pipeline.push({ $sort: sortMap[sort] || sortMap.newest });

    // $facet for pagination + count
    pipeline.push({
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    });

    const [result] = await products.aggregate(pipeline).toArray();
    const total = result.total[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Products API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
```

### 7.5 Auth Middleware for API Routes

```typescript
// lib/auth/api-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    return verifyToken(token);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    return verifyToken(token);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }
}
```

---

## 8. Layout Architecture

### 8.1 Proposed Layout Tree

```
app/layout.tsx (root)
└── <body>
    └── <StoreProvider>          ← Single instance wraps everything
        └── {children}
            │
            ├── app/[locale]/layout.tsx
            │   ├── BrandingInitializer (server data as props)
            │   ├── ThemeInitializer
            │   ├── LayoutWrapper
            │   │   ├── AdminBar (top strip)
            │   │   ├── Header (navigation, mega-menu)
            │   │   ├── {children}
            │   │   │   ├── loading.tsx (Suspense boundary)
            │   │   │   └── error.tsx (Error boundary)
            │   │   └── Footer
            │   └── AnalyticsInjector
            │
            └── app/[locale]/admin/(dashboard)/layout.tsx
                ├── Auth gate (server: read cookie, verify JWT)
                ├── Sidebar
                ├── AdminHeader
                └── {children}
                    ├── loading.tsx
                    └── error.tsx
```

**Key rules:**
- **Single `<StoreProvider>`** at root layout — no nested providers
- **Admin layout** does NOT wrap a second `<StoreProvider>` — it uses the root one
- **Admin layout** checks auth server-side (read cookie, verify JWT, redirect if invalid)
- **Storefront layout** renders header/footer for public pages
- **Auth pages** (login, signup) render inside storefront layout but header/footer are hidden by `LayoutWrapper`
- **No layout-level data fetching** — each page fetches only what it needs

### 8.2 LayoutWrapper (Revised)

```typescript
// components/LayoutWrapper.tsx
"use client";
import { usePathname } from "next/navigation";
import SiteChrome from "./SiteChrome";

export default function LayoutWrapper({
  children,
  brandConfig,
}: {
  children: React.ReactNode;
  brandConfig: any;
}) {
  const pathname = usePathname();
  const isStorefrontPage = !pathname.startsWith("/admin") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup");

  if (!isStorefrontPage) return <>{children}</>;

  return <SiteChrome brandConfig={brandConfig}>{children}</SiteChrome>;
}
```

### 8.3 Removal of `<Providers.tsx>`

The current `components/Providers.tsx` dispatches `GetAllCategories` and `GetCart` on every page load. This is removed entirely — each page uses RTK Query hooks to fetch exactly what it needs.

---

## 9. Directory Structure

### 9.1 Proposed Full File Tree

```
app/
├── layout.tsx                      # Root — <html>, <body>, single <StoreProvider>
├── globals.css                     # Tailwind + custom styles
├── not-found.tsx                   # 404 page
├── [locale]/                       # Dynamic locale segment
│   ├── layout.tsx                  # Locale shell — BrandingInitializer, ThemeInitializer, LayoutWrapper
│   ├── loading.tsx                 # Global locale loading state
│   ├── error.tsx                   # Global locale error boundary
│   ├── page.tsx                    # Home (server) — generateMetadata
│   ├── about/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── contact/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── _components/
│   │       └── ContactForm.tsx     # Client component
│   ├── shop/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── ProductGrid.tsx
│   │       ├── SidebarFilters.tsx
│   │       └── Pagination.tsx
│   ├── category/
│   │   ├── [slug]/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── _components/
│   │   └── page.tsx                # All categories overview
│   ├── product/
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       └── _components/
│   │           ├── Gallery.tsx
│   │           ├── VariantSelector.tsx
│   │           └── AddToCart.tsx
│   ├── cart/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── CartItemList.tsx
│   │       └── CartSummary.tsx
│   ├── checkout/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       ├── ShippingForm.tsx
│   │       ├── PaymentForm.tsx
│   │       └── OrderReview.tsx
│   ├── login/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── signup/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── account/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/
│   │       └── ProfileForm.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── wishlist/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── services/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── faq/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── [...slug]/                  # Catch-all for CMS pages
│   │   └── page.tsx
│   └── admin/
│       ├── login/                  # Admin-specific login (if needed)
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   └── error.tsx
│       └── (dashboard)/
│           ├── layout.tsx          # Admin shell (auth gate, sidebar, header)
│       ├── loading.tsx
│       ├── error.tsx
│       ├── page.tsx                # Admin dashboard
│       ├── products/...
│       ├── categories/...
│       ├── orders/...
│       ├── users/...
│       ├── attributes/...
│       ├── variants/...
│       ├── pages/...
│       ├── forms/...
│       ├── media/...
│       ├── branding/...
│       └── settings/...
└── api/                            # API routes (see section 7)
```

### 9.2 Supporting Libraries

```
lib/
├── store/
│   ├── api/                        # RTK Query API slices (NEW)
│   │   ├── productsApi.ts
│   │   ├── cartApi.ts
│   │   ├── ordersApi.ts
│   │   └── categoriesApi.ts
│   ├── auth/                       # Keep as-is
│   ├── pages/                      # Keep as-is
│   ├── menus/                      # Keep as-is
│   ├── branding/                   # Keep (merged from 3 slices)
│   ├── shoppingCart/               # Reduced UI-only slice
│   ├── comments/                   # Keep as-is
│   ├── forms/                      # Keep as-is
│   ├── features/                   # Keep as-is (admin slices)
│   └── ...other admin slices       # Keep as-is
│   ├── hooks.ts                    # Keep as-is
│   └── store.ts                    # Updated
├── services/                       # Server-side data access
│   ├── page.ts                     # getPageData(), getPageMetadata()
│   ├── products.ts                 # Server-side product queries
│   ├── cart.ts                     # Server-side cart queries (if needed)
│   ├── orders.ts                   # Server-side order queries
│   └── auth.ts                     # Server-side auth helpers
├── auth.ts                         # JWT utils (keep as-is)
├── db.ts                           # MongoDB connection (keep as-is)
├── mongodb.ts                      # MongoDB utils (keep as-is)
├── apiProxy.ts                     # Keep for FastAPI compatibility
├── commerce.ts                     # Keep as-is
├── utils.ts                        # Keep as-is
├── filters.ts                      # Composable filter/sort builders (NEW)
└── api-auth.ts                     # API route auth middleware (NEW)

components/
├── ui/                             # shadcn/ui primitives (keep as-is)
├── storefront/                     # Storefront shared components (NEW)
│   ├── header/
│   │   ├── Header.tsx
│   │   ├── MegaMenu.tsx
│   │   └── SearchOverlay.tsx
│   ├── footer/
│   │   └── Footer.tsx
│   ├── product-card/
│   │   └── ProductCard.tsx
│   └── shared/
│       ├── Breadcrumbs.tsx
│       └── PageHeader.tsx
├── admin/                          # Admin components (keep as-is)
└── shared/                         # Shared components (keep as-is)

hooks/                              # Custom React hooks (NEW if needed)
├── use-debounce.ts
└── use-media-query.ts

data/                               # Static/mock data fallbacks (keep as-is)

public/                             # Static assets (keep as-is)
```

---

## 10. SEO Requirements

> **Current state:** Only 3 pages (Home, About, Ecommerce) have `generateMetadata`. The other 15+ public pages have zero SEO metadata — no title, no description, no Open Graph, no robots directives. This is the single biggest SEO gap.

### 10.1 Noindex vs Index Rules

| Category | Pages | Robots Directive | Rationale |
|----------|-------|-----------------|-----------|
| **Indexed (public content)** | Home, Shop, Category, Product, About, Blog, Services, FAQ, Contact, CMS catch-all | `index: true, follow: true` | These are discoverable public pages |
| **Noindex (functional/auth)** | Cart, Checkout, Login, Signup, Account, Orders, Orders/[id], Wishlist | `index: false, follow: false` | Cart contents are user-specific, auth pages have no value in search results |
| **Admin** | All admin routes | `index: false, follow: false` (handled by layout) | Internal tooling |

### 10.2 Per-Page SEO Metadata Matrix

Every page must export `generateMetadata`. The matrix below specifies exactly what each page needs:

| Page | Route | Title Template | Description Source | OG Image | Schema | Notes |
|------|-------|---------------|-------------------|----------|--------|-------|
| **Home** | `/` | `"{tagline} | NestCraft Living"` | CMS `metaDescription.en` | Hero image or brand OG | `Organization`, `WebSite` | ✅ Existing. Enhance with structured data |
| **About** | `/about` | `"About Us | NestCraft Living"` | CMS `metaDescription.en` | About page image | `Organization`, `AboutPage` | ✅ Existing. Add structured data |
| **Shop** | `/shop` | `"Shop Furniture | NestCraft Living"` | CMS `metaDescription.en` or default | Category collage | `ItemList`, `BreadcrumbList` | New. Dynamic title based on active filters |
| **Category/[slug]** | `/category/[slug]` | `"{category.name} | NestCraft Living"` | `category.description` truncated | Category image | `BreadcrumbList`, `ItemList` | New. Dynamic from category data |
| **Product/[slug]** | `/product/[slug]` | `"{product.name} | NestCraft Living"` | `product.description` (first 160 chars) | Product primary image (hero) | **`Product`**, `BreadcrumbList` | New. **Most important for SEO** |
| **Blog** | `/blog` | `"Blog | NestCraft Living"` | CMS or default | Blog page image | `BlogPosting` (per post), `BreadcrumbList` | New |
| **Services** | `/services` | `"Services | NestCraft Living"` | CMS `metaDescription.en` | Services image | `Service` | New |
| **FAQ** | `/faq` | `"FAQ | NestCraft Living"` | Default description | Brand OG | **`FAQPage`** | New. FAQ schema = search-rich results |
| **Contact** | `/contact` | `"Contact Us | NestCraft Living"` | Default description | Brand OG | `ContactPoint` | New |
| **CMS catch-all** | `/[slug]` | `"{page.title} | NestCraft Living"` | CMS `metaDescription.en` | CMS OG image | Varies by content type | New. For any CMS-created page |
| **Cart** | `/cart` | `"Shopping Cart | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Checkout** | `/checkout` | `"Checkout | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Login** | `/login` | `"Sign In | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Signup** | `/signup` | `"Create Account | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Account** | `/account` | `"My Account | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Orders** | `/orders` | `"My Orders | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Orders/[id]** | `/orders/[id]` | `"Order #{id} | NestCraft Living"` | No description needed | None | None | **noindex** |
| **Wishlist** | `/wishlist` | `"My Wishlist | NestCraft Living"` | No description needed | None | None | **noindex** |
| **404** | not-found.tsx | `"Page Not Found | NestCraft Living"` | Default description | None | None | **noindex** |

### 10.3 Title Template (Root Layout)

The root layout should define a title template so every page automatically gets the brand suffix:

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "NestCraft Living — Design-Led Furniture for Modern Homes",
    template: "%s | NestCraft Living",
  },
  description: "Design-led furniture and home decor. Minimalist, handcrafted pieces for every room.",
  metadataBase: new URL("https://nestcraft.com"),
};
```

Each page then sets its own title without the suffix:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: product.name,  // Automatically becomes "Product Name | NestCraft Living"
    description: truncate(product.description, 160),
    // ...
  };
}
```

### 10.4 `generateMetadata` Templates by Page Type

#### Static Content Page (Home, About, Services, FAQ)
```typescript
// app/[locale]/services/page.tsx
import { getPageMetadata } from "@/lib/services/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return getPageMetadata("services", {
    locale: (await params).locale,
    titleSuffix: "Services",
    description: "Explore our range of interior design and furniture services.",
  });
}
```

#### Category Page (Dynamic)
```typescript
// app/[locale]/category/[slug]/page.tsx
import { getCategoryBySlug } from "@/lib/services/categories";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: category.name,
    description: truncate(category.description || `Shop ${category.name} furniture collection`, 160),
    openGraph: {
      title: `${category.name} | NestCraft Living`,
      description: truncate(category.description || `Browse our ${category.name} collection.`, 160),
      images: category.image ? [{ url: category.image, width: 1200, height: 630 }] : [],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `https://nestcraft.com/category/${params.slug}` },
  };
}
```

#### Product Page (Dynamic — most important for SEO)
```typescript
// app/[locale]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/services/products";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.gallery?.find(g => g.id === product.primaryImageId)?.url || product.gallery?.[0]?.url;
  const price = product.pricing?.price || product.price;

  return {
    title: product.name,
    description: truncate(product.description, 160) || `${product.name} — ${product.sku}. Shop online at NestCraft.`,
    openGraph: {
      title: `${product.name} | NestCraft Living`,
      description: truncate(product.description, 160),
      images: primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : [],
      type: "product",
      url: `https://nestcraft.com/product/${params.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: truncate(product.description, 200),
      images: primaryImage ? [primaryImage] : [],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `https://nestcraft.com/product/${params.slug}` },
  };
}
```

#### Noindex Page (Cart, Checkout, Auth)
```typescript
// app/[locale]/cart/page.tsx
export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: false },
};
```

### 10.5 Structured Data (JSON-LD)

Structured data is critical for e-commerce SEO. Implement as server components that render `<script type="application/ld+json">`.

#### Product Schema (on product/[slug])

```typescript
// components/seo/ProductSchema.tsx
import { Product } from "@/types";

export function ProductSchema({ product }: { product: Product }) {
  const primaryImage = product.gallery?.find(g => g.id === product.primaryImageId)?.url || product.gallery?.[0]?.url;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": `https://nestcraft.com/product/${product.slug}#product`,
    "name": product.name,
    "description": truncate(product.description, 5000),
    "sku": product.sku,
    "mpn": product.sku,
    "image": primaryImage || undefined,
    "brand": {
      "@type": "Brand",
      "name": "NestCraft Living",
    },
    "offers": {
      "@type": "Offer",
      "url": `https://nestcraft.com/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.pricing?.price || product.price,
      "priceValidUntil": getNextYear(),
      "availability": getStockAvailability(product.variants),
      "itemCondition": "https://schema.org/NewCondition",
    },
    "review": product.rating ? [{
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": product.rating,
        "bestRating": "5",
      },
    }] : undefined,
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || 0,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

#### BreadcrumbList Schema (on all sub-pages)

```typescript
// components/seo/BreadcrumbSchema.tsx
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://nestcraft.com${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**Breadcrumb path specifics:**
| Page | Breadcrumbs |
|------|------------|
| Home | `[{ name: "Home", url: "/" }]` |
| Shop | `[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }]` |
| Category | `[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }, { name: "{category.name}", url: "/category/{slug}" }]` |
| Product | `[{ name: "Home", url: "/" }, { name: "{category.name}", url: "/category/{catSlug}" }, { name: "{product.name}", url: "/product/{slug}" }]` |

#### FAQ Schema (on /faq)

```typescript
// app/[locale]/faq/page.tsx
import { getPageData } from "@/lib/services/page";
import { FaqSchema } from "@/components/seo/FaqSchema";

export default async function FaqPage() {
  const data = await getPageData("faq");
  return (
    <>
      <FaqSchema questions={extractFaqs(data?.content)} />
      {/* page content */}
    </>
  );
}
```

#### Organization Schema (on root layout)

```typescript
// components/seo/OrganizationSchema.tsx
export function OrganizationSchema({ brandConfig }: { brandConfig: any }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://nestcraft.com/#organization",
    "name": brandConfig?.companyInfo?.name || "NestCraft Living",
    "url": "https://nestcraft.com",
    "logo": brandConfig?.logos?.[0]?.url || "https://nestcraft.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": brandConfig?.companyInfo?.phone || "+91-9810159604",
      "contactType": "customer service",
    },
    "sameAs": [
      "https://www.instagram.com/nestcraft_furniture/",
      "https://www.facebook.com/profile.php?id=61581337593979",
      "https://x.com/NestCFurniture",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 10.6 Sitemap & Robots

#### Dynamic Sitemap (`app/sitemap.ts`)

Generate a comprehensive sitemap that includes all public pages, categories, and products. This must be dynamic to reflect current inventory.

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import { connectTenantDB } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://nestcraft.com";

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.4 },
  ];

  // Dynamic categories (from MongoDB)
  const db = await connectTenantDB();
  const categories = await db.collection("categories")
    .find({ status: "active" })
    .project({ slug: 1, updatedAt: 1 })
    .toArray();

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt || new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic products (from MongoDB)
  const products = await db.collection("products")
    .find({ status: "active" })
    .project({ slug: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(50000)  // Sitemap limit
    .toArray();

  const productPages = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
```

#### Robots.txt (`app/robots.ts`)

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/login",
          "/signup",
          "/account",
          "/orders",
          "/wishlist",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: "https://nestcraft.com/sitemap.xml",
  };
}
```

### 10.7 Open Graph & Twitter Images

#### Dynamic OG Image Generation

For product pages, generate dynamic OG images using Next.js `ImageResponse` (Edge runtime):

```typescript
// app/[locale]/product/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/services/products";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#06130B",
        color: "#EAF4EC",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 60, fontWeight: 700 }}>{product?.name}</span>
          <span style={{ fontSize: 30, marginTop: 20, color: "#98c45f" }}>
            ₹{product?.pricing?.price || product?.price}
          </span>
          <span style={{ fontSize: 20, marginTop: 40, opacity: 0.6 }}>NestCraft Living</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
```

**OG image routes needed:**
| Page | OG Image File |
|------|---------------|
| Home | `app/opengraph-image.tsx` (static brand OG) |
| Product | `app/[locale]/product/[slug]/opengraph-image.tsx` (dynamic) |
| Category | `app/[locale]/category/[slug]/opengraph-image.tsx` (dynamic) |
| About, Blog, etc. | `app/[locale]/<page>/opengraph-image.tsx` (static, one per page type) |

### 10.8 Core Web Vitals SEO Checklist

Performance directly impacts search rankings. These are mandatory:

| Requirement | Implementation | Priority |
|------------|---------------|----------|
| **LCP (Largest Contentful Paint)** < 2.5s | Use `next/image` with `priority` on hero images. Server components eliminate render-blocking JS | 🔴 Critical |
| **CLS (Cumulative Layout Shift)** < 0.1 | Always define explicit `width` + `height` on images. No layout shifts from async content | 🔴 Critical |
| **INP (Interaction to Next Paint)** < 200ms | Minimize client JS. Server components + RTK Query reduce bundle. Lazy-load reviews/related products | 🟡 High |
| **FCP (First Contentful Paint)** < 1.8s | Server rendering eliminates blank white page. Preload critical CSS/fonts | 🟡 High |
| **TTFB (Time to First Byte)** < 800ms | ISR/SSG pages have near-zero TTFB. Add `Cache-Control` to API responses | 🟡 High |
| **Image optimization** | `next/image` with WebP/AVIF, lazy loading, responsive `sizes` attribute | 🟢 Medium |
| **Font optimization** | Self-host Google Fonts or use `next/font` to eliminate external requests | 🟢 Medium |
| **Preconnect to origins** | Add `<link rel="preconnect">` for CDN, FastAPI, and analytics | 🟢 Medium |

### 10.9 Image Optimization for SEO

```typescript
// components/ui/OptimizedImage.tsx
import Image from "next/image";

// ALWAYS use next/image for product images:
<Image
  src={product.primaryImage}
  alt={product.name}           // ✅ Descriptive alt text (keyword-rich)
  width={800}
  height={800}
  priority={isHero}            // ✅ Priority on first-fold images
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

**Image alt text rules:**
- Product images: `"{product.name} — {product.category} furniture by NestCraft"`
- Category images: `"{category.name} furniture collection — NestCraft Living"`
- Hero/banner images: Include descriptive text, never leave empty
- Decorative images: Use `alt=""` (empty string, not omitted)

### 10.10 Canonical URL Rules

| Scenario | Canonical URL |
|----------|---------------|
| Clean product page | `https://nestcraft.com/product/{slug}` |
| Shop with filters | `https://nestcraft.com/shop` (not the filter URL) |
| Product with variant params | `https://nestcraft.com/product/{slug}` (not variant URL) |
| URL with UTM parameters | Omit from canonical, use clean URL |
| Category page | `https://nestcraft.com/category/{slug}` |
| Paginated pages | `https://nestcraft.com/shop?page=2` (page-specific) |

### 10.11 `generateStaticParams` for ISR

For indexed pages, use `generateStaticParams` to pre-render popular pages at build time:

```typescript
// app/[locale]/product/[slug]/page.tsx
export async function generateStaticParams() {
  const db = await connectTenantDB();
  const products = await db.collection("products")
    .find({ status: "active" })
    .project({ slug: 1 })
    .sort({ createdAt: -1 })
    .limit(100)           // Pre-render top 100 products
    .toArray();

  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;  // Generate remaining on-demand (ISR)
export const revalidate = 300;      // Revalidate every 5 minutes
```

### 10.12 SEO Audit Checklist

Before launch, verify each item:

- [ ] Every public page has `generateMetadata` with unique title + description
- [ ] `robots.ts` disallows `/cart`, `/checkout`, `/login`, `/signup`, `/account`, `/orders`, `/wishlist`, `/admin`, `/api/`
- [ ] `sitemap.ts` dynamically includes all products + categories + static pages
- [ ] Product page has `Product` JSON-LD schema with price, availability, brand, images
- [ ] Every sub-page has `BreadcrumbList` JSON-LD schema
- [ ] FAQ page has `FAQPage` JSON-LD schema
- [ ] Root layout has `Organization` JSON-LD schema with social links
- [ ] Dynamic OG images for products + categories (at minimum)
- [ ] Static OG images for Home, About, Blog, Services, Contact
- [ ] All product images use `next/image` with `priority` on hero
- [ ] Canonical URLs set on every page
- [ ] `metadataBase` is set to production URL
- [ ] Title template set in root layout (`"%s | NestCraft Living"`)
- [ ] `generateStaticParams` for products (top 100), categories (all), blog posts (all)
- [ ] ISR `revalidate` values set per page type (see section 5.4)
- [ ] LCP test passes on PageSpeed Insights (target: < 2.5s)
- [ ] CLS test passes on PageSpeed Insights (target: < 0.1)
- [ ] Validate structured data with Google Rich Results Test on staging
- [ ] Image `alt` text is descriptive and keyword-rich for all product images

### 10.13 Summary: Pages to Add `generateMetadata`

| Page | Priority | Has It? | Action |
|------|----------|---------|--------|
| Home | ✅ | ✅ | Enhance with structured data |
| About | ✅ | ✅ | Enhance with structured data |
| Shop (Ecommerce) | ✅ | ✅ | Enhance with dynamic title based on filters |
| Product/[slug] | 🔴 High | ❌ | **Must add** — most important for SEO |
| Category/[slug] | 🔴 High | ❌ | **Must add** |
| Shop | 🔴 High | ❌ | **Must add** (note: current has both shop/ and ecommerce/ routes) |
| Blog | 🟡 Medium | ❌ | Add |
| Contact | 🟡 Medium | ❌ | Add |
| Services | 🟡 Medium | ❌ | Add |
| FAQ | 🟡 Medium | ❌ | Add |
| CMS catch-all | 🟡 Medium | ❌ | Add |
| Cart | 🟢 Low | ❌ | Add with `robots: noindex` |
| Checkout | 🟢 Low | ❌ | Add with `robots: noindex` |
| Login | 🟢 Low | ❌ | Add with `robots: noindex` |
| Signup | 🟢 Low | ❌ | Add with `robots: noindex` |
| Account | 🟢 Low | ❌ | Add with `robots: noindex` |
| Orders | 🟢 Low | ❌ | Add with `robots: noindex` |
| Orders/[id] | 🟢 Low | ❌ | Add with `robots: noindex` |
| Wishlist | 🟢 Low | ❌ | Add with `robots: noindex` |
| 404 | 🟢 Low | ❌ | Add with `robots: noindex` |
| Admin (all) | — | ❌ | Already excluded via layout |

---

## 11. Critical Gaps to Address

### 11.1 Production-Blocking Gaps

| Gap | Impact | Solution |
|-----|--------|----------|
| **No order persistence** | Checkout is a UI prototype — no order is created | Create `orders` collection + `POST /api/orders` |
| **No user-facing order history** | Users cannot view past purchases | `GET /api/orders` filtered by `userId` |
| **No product search** | Header search filters static mock data only | Add `$text` index to MongoDB + search endpoint |
| **No price range filter backend** | Filter component exists, no backend support | Add `minPrice`/`maxPrice` to `GET /api/products` |
| **No coupon/discount system** | Cart has no promo code input | Create `coupons` collection + coupon validation |
| **Inconsistent auth on API routes** | Some mutations don't check auth | Apply `requireAdmin`/`requireAuth` to all mutation routes |

### 11.2 Feature Gaps

| Gap | Priority | Solution |
|-----|----------|----------|
| No product reviews/ratings | Low | Create `reviews` collection + `GET/POST /api/products/[id]/reviews` |
| No sorting on product list | Low | Add `sort` param to `GET /api/products` |
| Wishlist is a stub | Low | Create `wishlists` collection + `GET/POST/DELETE /api/wishlist` |
| No `generateStaticParams` for products | Low | Add `generateStaticParams` for ISR on product detail pages |

### 11.3 Performance Gaps

| Gap | Impact | Solution |
|-----|--------|----------|
| Layout-level data prefetch | Every page loads unnecessary data | Remove `Providers.tsx`, move fetches to page level |
| No `Cache-Control` on API routes | Every request hits MongoDB | Add `stale-while-revalidate` headers to GET routes |
| 24 client pages = large JS bundle | Slow first load | Convert to server components + RTK Query leaf components |
| No `loading.tsx`/`error.tsx` | Poor UX, crashes | Add to every route segment |

---

## 12. Migration Phases

### Phase 1: Foundation (Week 1)

**Goal:** Fix critical gaps without architectural changes

- [ ] Add `loading.tsx` + `error.tsx` to **every route segment**
- [ ] Implement order persistence: `POST /api/orders` + `GET /api/orders`
- [ ] Add `Cache-Control` headers to all `GET /api/*` routes
- [ ] Fix inconsistent auth on API mutation routes
- [ ] Merge `branding` + `websiteDetail` + `businessBlueprint` into one `brandingSlice`
- [ ] Add `generateMetadata` to all public pages (at minimum set `robots`)

### Phase 2: RTK Query Introduction (Week 2-3)

**Goal:** Eliminate thunks, introduce RTK Query

- [ ] Create `lib/store/api/productsApi.ts` — replaces `productsThunk`, `productsSlices`
- [ ] Create `lib/store/api/cartApi.ts` — replaces `cartThunk`, reduces `cartSlice` to UI-only
- [ ] Create `lib/store/api/categoriesApi.ts` — replaces `GetAllCategories` thunk
- [ ] Create `lib/store/api/ordersApi.ts` — replaces `ordersThunk`, `ordersSlice`
- [ ] Create `lib/store/api/wishlistApi.ts` — replaces stub `wishlistSlice`
- [ ] Delete 10+ thunk files (see section 13)
- [ ] Remove `components/Providers.tsx` (layout-level prefetch)
- [ ] Delete `lib/GetAllDetails/` directory (8 components)
- [ ] Update `lib/store/store.ts` with RTK Query middleware

### Phase 3: Server Component Migration (Week 4-5)

**Goal:** Convert 24 client pages to server components

- [ ] Convert Shop page: Server shell → `useGetProductsQuery` in leaf
- [ ] Convert Category page: Server shell → RTK Query in leaf
- [ ] Convert Product detail: Server shell → client leaf components
- [ ] Convert Cart page: Server shell → `useGetCartQuery` in leaf
- [ ] Convert Checkout page: Server shell → checkout form leaf
- [ ] Convert Login/Signup: Server shell → form leaf
- [ ] Convert Account, Orders: New server pages
- [ ] Convert Blog, Contact, Services, FAQ: Server fetch CMS data
- [ ] Convert Wishlist: RTK Query fetch

### Phase 4: API Route Consolidation (Week 6)

**Goal:** Clean, flat API route structure

- [ ] Migrate `app/api/ecommerce/products/*` → `app/api/products/*`
- [ ] Migrate `app/api/ecommerce/cart/*` → `app/api/cart/*`
- [ ] Migrate `app/api/ecommerce/orders/*` → `app/api/orders/*`
- [ ] Migrate `app/api/ecommerce/categories/*` → `app/api/categories/*`
- [ ] Migrate admin-only routes → `app/api/admin/*`
- [ ] Add standard API response envelope to all routes
- [ ] Add auth middleware to all mutation routes

### Phase 5: Polish (Week 7+)

**Goal:** Performance, DX, completeness

- [ ] Add `generateStaticParams` for product/category/blog pages
- [ ] Add `$text` search index for MongoDB product search
- [ ] Integrate Razorpay payment gateway for real checkout
- [ ] Add coupon/discount system
- [ ] Add product reviews/ratings
- [ ] Add `Cache-Control: stale-while-revalidate` to all GET API routes
- [ ] FastAPI deprecation for new features (route through Next.js API directly)

---

## 13. Files to Delete / Consolidate

### Phase 1 — Immediately Removable

| File | Reason |
|------|--------|
| `lib/store/websiteDetail/websiteDetailSlice.ts` | Merged into `brandingSlice` |
| `lib/store/websiteDetail/websiteDetailThunk.ts` | Merged into `brandingThunks` |
| `lib/store/websiteDetail/websiteDetailType.ts` | Merged into branding types |
| `lib/store/businessBlueprints/businessBlueprintsThunk.ts` | Merged into `brandingThunks` |
| `lib/store/businessBlueprints/businessBlueprintSlice.ts` | Merged into `brandingSlice` |
| `components/Providers.tsx` | Layout-level prefetch → removed |
| `components/AnalyticsInjector.tsx` | Move into layout directly |

### Phase 2 — After RTK Query Introduction

| File | Replaced By |
|------|-------------|
| `lib/GetAllDetails/GetAllProducts.tsx` | `useGetProductsQuery()` |
| `lib/GetAllDetails/GetSingleProduct.tsx` | `useGetProductBySlugQuery()` |
| `lib/GetAllDetails/GetCart.tsx` | `useGetCartQuery()` |
| `lib/GetAllDetails/GetProductCategoryWise.tsx` | `useGetProductsQuery({ categoryIds })` |
| `lib/GetAllDetails/GetAllCategories.tsx` | `useGetCategoriesQuery()` |
| `lib/GetAllDetails/GetAllAttributes.tsx` | `useGetAttributesQuery()` |
| `lib/GetAllDetails/GetAllForms.tsx` | Admin use — keep but move to admin |
| `lib/GetAllDetails/GetUser.tsx` | Keep — auth hydration |
| `lib/store/products/productsThunk.ts` | RTK Query `productsApi` |
| `lib/store/products/productsSlices.ts` | RTK Query auto-reducer |
| `lib/store/cart/cartThunk.ts` | RTK Query `cartApi` |
| `lib/store/orders/ordersThunk.ts` | RTK Query `ordersApi` |
| `lib/store/orders/ordersSlice.ts` | RTK Query auto-reducer |
| `lib/store/wishlist/wishlistSlice.ts` | RTK Query `wishlistApi` |
| `lib/store/categories/categoriesThunk.ts` | RTK Query `categoriesApi` |
| `lib/store/categories/categoriesSlices.ts` | RTK Query auto-reducer |
| `lib/store/attributes/attributesThunk.ts` | Admin — keep but move |
| `lib/store/attributes/attributeSlices.ts` | Admin — keep |

**Total: ~18 files deleted**

### Files to Keep As-Is

```
app/StoreProvider.tsx                       ← Keep (single provider at root)
app/middleware.ts                            ← Keep (locale handling)
app/layout.tsx                               ← Keep (root layout)
app/globals.css                              ← Keep
app/api/ecommerce/upload/route.ts            ← Keep
app/api/admin/*                              ← Keep
app/[locale]/admin/(dashboard)/layout.tsx     ← Keep (auth gate)
app/[locale]/admin/(dashboard)/**/*           ← Keep (all admin pages)
lib/store/auth/*                             ← Keep
lib/store/pages/*                            ← Keep
lib/store/menus/*                            ← Keep
lib/store/comments/*                         ← Keep
lib/store/forms/*                            ← Keep
lib/store/features/*                         ← Keep (admin slices)
lib/store/users/*                            ← Keep (admin slice)
lib/db.ts                                    ← Keep
lib/mongodb.ts                               ← Keep
lib/auth.ts                                  ← Keep
lib/commerce.ts                              ← Keep
lib/apiProxy.ts                              ← Keep (FastAPI compatibility)
components/ui/*                               ← Keep (shadcn)
components/shared/*                           ← Keep
components/admin/*                            ← Keep
components/category/*                         ← Keep (Pagination, PriceRangeFilter)
```

---

## 14. Key Wins Summary

| Area | Before | After | Impact |
|------|--------|-------|--------|
| **Client pages** | 24 out of 36 | **2-4** (leaf interactive components only) | Drastically smaller JS bundle, faster LCP |
| **Redux slices** | 18 | **~14** (4 RTK Query + 7 traditional + 7 admin) | Simpler state tree |
| **Thunks** | 15+ hand-written | **~7** (admin only) | Zero boilerplate for public data |
| **Data fetching** | 3 patterns: server, thunks, useEffect | **2 patterns**: server `cache()` + RTK Query | Consistent, predictable |
| **Layout prefetch** | 10+ thunks fire on every navigation | **Zero** — each page fetches what it needs | No wasted network requests |
| **loading.tsx** | Only on a few routes | **Every route** | Professional UX with skeletons |
| **error.tsx** | Only on a few routes | **Every route** | No uncaught page crashes |
| **SEO** | 3 pages with metadata | **All 18 public pages** | Search ranking improvement |
| **Cache** | Mostly uncached | RTK Query auto-cache + `Cache-Control` headers | Faster repeat visits |
| **API routes** | 15+ under `app/api/ecommerce/*` | Consolidated under `app/api/*` | Cleaner, discoverable |
| **Bundle size** | Every page loads full Redux store | RTK Query code-splits naturally | Smaller initial load |
| **Admin** | Works | **Untouched** | No regression risk |

---

## 15. Appendix: Current vs Proposed Comparison

### State Management

| Concern | Current | Proposed |
|---------|---------|----------|
| **Server-state** | 10+ manual thunks + slices | **RTK Query** `createApi` — auto caching, dedup, refetch |
| **Client-state** | Auth, pages, menus, cart (mixed) | Auth, pages, menus, shoppingCart (UI only), comments, forms |
| **Branding config** | 3 separate slices (branding, websiteDetail, businessBlueprint) | **1 merged slice** (`branding`) |
| **Cart** | Full slice with server data + thunks | **UI-only** `shoppingCartSlice` + RTK Query `cartApi` |
| **Admin** | 7 slices (untouched) | 7 slices (untouched) |
| **Loading/error** | Manual in every slice | Auto-generated by RTK Query: `isLoading`, `isError`, `isFetching` |
| **Mutations** | `createAsyncThunk` + manual state diff | RTK Query `useMutation` + auto `invalidatesTags` → automatic refetch |

### Page Architecture

| Concern | Current | Proposed |
|---------|---------|----------|
| **Home** | Mixed (server + client) | **Server** component |
| **About** | Mixed (server + client) | **Server** component |
| **Shop** | Client (Redux thunks) | **Server** shell + client `ProductGrid` leaf |
| **Category/[id]** | Client (Redux thunks) | **Server** shell + client leaf |
| **Product/[id]** | Mixed (server + client) | **Server** shell + client `VariantSelector`/`AddToCart` |
| **Cart** | Client | **Server** shell + client `CartItemList` |
| **Checkout** | Client | **Server** shell + client form |
| **Login/Signup** | Client | **Server** shell + client form |
| **Account/Orders** | Missing | **New** server pages |
| **Wishlist** | Stub (no API) | **New** + RTK Query |
| **Blog/Contact/Services/FAQ** | Client | **Server** (CMS data fetch) |

### Data Fetching

| Scenario | Current | Proposed |
|----------|---------|----------|
| **Initial page data** | Server `getPageData()` ✅ | Same — keep `React.cache()` |
| **Product list** | `fetchProductsThunk` → FastAPI | `useGetProductsQuery()` → `/api/products` |
| **Product detail** | `getSingleProduct()` (server) + thunk | `useGetProductBySlugQuery()` |
| **Cart** | `fetchCartThunk` → `/api/cart` | `useGetCartQuery()` → `/api/cart` |
| **Categories** | `fetchCategoriesThunk` → FastAPI | `useGetCategoriesQuery()` → `/api/categories` |
| **Orders** | `fetchOrdersThunk` → `/api/orders` | `useGetOrdersQuery()` → `/api/orders` |
| **Pagination/filters** | Manual via thunk params | RTK Query query params + `refetchOnChange` |
| **Mutations** | Thunk → FastAPI/API route | RTK Query `useMutation` + auto invalidation |
| **Layout prefetch** | `<Providers>` dispatches 2+ thunks | **Removed** — each page fetches its own data |

### Performance

| Metric | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| **Client JS per page** | High (18 slices + 24 client pages) | Low (7 traditional slices + 4 API slices) | **~60% reduction** |
| **Network requests per navigation** | 3-5 (layout prefetch + page fetch) | 1-2 (page fetch only) | **~50% fewer requests** |
| **Cache hits** | None (Redux `hasFetched` manual) | Auto (RTK Query `tagTypes`) | **Faster repeat visits** |
| **API response time** | Variable (no caching) | Cache-Control headers | **Reduce server load** |
| **SEO coverage** | 3/18 pages | 18/18 pages | **6x SEO improvement** |
| **Error handling** | Inconsistent | Loading + error boundaries everywhere | **No uncaught crashes** |

---

*This document represents the target architecture. See `ARCHITECTURE.md` for the current state analysis.*
