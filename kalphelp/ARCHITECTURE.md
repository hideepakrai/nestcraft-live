# E-Commerce Next.js App Analysis & New Site Method Plan

## 1. Overview

| Property | Value |
|----------|-------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui |
| **State** | Redux Toolkit (16 slices) |
| **Database** | MongoDB (native driver, no Mongoose) |
| **Backend** | Dual: Next.js API routes (direct MongoDB) + FastAPI proxy |
| **Auth** | Dual: FastAPI `/auth/*` (client login) + Next.js `/api/login` (server, direct MongoDB). JWT in `auth_token` httpOnly cookie. No redirect on `/login` for authenticated users. Admin gate at `dashboard/layout.tsx`. |
| **CMS** | Headless (page blocks stored in MongoDB, served via FastAPI) |
| **Icons** | lucide-react |
| **Animation** | motion (Framer Motion v12) |
| **Charts** | recharts (admin dashboard) |
| **Toasts** | sonner |
| **Forms** | react-hook-form + zod |
| **Cart** | Session-based (guest cookie) + user merge on login |

**Main data sources:**
- **MongoDB** — Products, categories, attributes, variants, cart, orders, CMS pages, users, tenants
- **FastAPI backend** — Auth (`/auth/*`), CMS pages (`/cms/*`), commerce (`/commerce/*`), business blueprint (`/platform/*`)
- **Dual access pattern**: Next.js API routes under `/api/ecommerce/*` connect directly to MongoDB. Client-side thunks typically go through FastAPI. Some routes (like product detail server component) use both.

---

## 2. Locale Routing (Middleware)

**Single-language mode (English only).** Locales are hardcoded in `middleware.ts` — no MongoDB lookup. See [`middleware.md`](./middleware.md) for full details.

| URL | Behavior |
|-----|----------|
| `/` or `/about` | Internal rewrite to `/en{path}` — URL stays clean |
| `/en` or `/en/about` | 301 redirect strips locale → `/` or `/about` |
| `/hi` or `/hi/about` | 301 redirect strips locale → `/` or `/about` (English) |
| `/admin*` | Excluded from locale processing — has own layout |

All storefront routes are defined under `app/[locale]/` with a dynamic `[locale]` segment. The middleware ensures the `en` prefix never appears in the URL. Any non-English locale prefix is redirected to the clean English URL.

## 3. Pages and Routes

### 2.1 Product Pages

| Page Path | File Path | Router | Component Type | Key Features |
|-----------|----------|--------|---------------|--------------|
| `/{locale}/product/[id]` | `app/[locale]/product/[id]/page.tsx` | App | **Mixed** (server fetch + client component) | `getSingleProduct(id)` server-side → `<ProductDetailPage>`: image gallery, variant selector, quantity picker, add-to-cart, tabs (overview/details/reviews/shipping), accordion specs |
| `/{locale}/shop` | `app/[locale]/shop/page.tsx` | App | *n*Client** (all data via Redux thunks) | `<GetAllProducts>` prefetch → `<CategoryPage>`: product grid with filters, sidebar categories, pagination |
| `/{locale}/category/[id]` | `app/[locale]/category/[id]/page.tsx` | App | **Client** (all data via Redux thunks) | `<GetProductCategoryWise>` prefetch → `<CategoryPage>`: same component as shop, filtered by category ID |

### 2.2 Category / Collection Pages

| Page Path | File Path | Router | Component Type | Key Features |
|-----------|----------|--------|---------------|--------------|
| `/{locale}/shop` | see above | App | Client | All-category listing via `GetAllProducts`; sidebar with category nav; pagination; price range filter |
| `/{locale}/category/[id]` | see above | App | Client | Category-filtered product list via `fetchProductsByCategory`; same page template as shop |

### 2.3 Cart & Checkout Pages

| Page Path | File Path | Router | Component Type | Key Features |
|-----------|----------|--------|---------------|--------------|
| `/{locale}/cart` | `app/[locale]/cart/page.tsx` | App | Client | `<CartPage>`: item list with image/name/options/price, quantity +/- buttons, remove button, subtotal/tax (18% GST)/total, "Proceed to Checkout" link |
| `/{locale}/checkout` | `app/[locale]/checkout/page.tsx` | App | Client | 3-step wizard (Shipping → Payment → Review); cart summary sidebar; **no backend integration** (UI prototype only, dispatches `clearCart()` on completion) |

### 2.4 Search & Filter Pages

| Page Path | File Path | Router | Component Type | Key Features |
|-----------|----------|--------|---------------|--------------|
| `/{locale}/shop` | `app/[locale]/shop/page.tsx` | App | Client | Search bar in header (`SiteChrome.tsx`) filters static product array by name/category; no dedicated search page |
| `/{locale}/category/[id]` | `app/[locale]/category/[id]/page.tsx` | App | Client | Category filter via `categoryIds`; pagination; price range filter component |

### 2.5 Account / Order Pages

| Page Path | File Path | Router | Component Type | Key Features |
|-----------|----------|--------|---------------|--------------|
| `/{locale}/login` | `app/[locale]/login/page.tsx` | App | Client | Login form → `loginThunk` → FastAPI `/auth/login` → JWT httpOnly cookie. **No redirect for already-authenticated users** — login form is always rendered regardless of auth state. |
| `/{locale}/signup` | `app/[locale]/signup/page.tsx` | App | Client | Registration form → `signupThunk` → FastAPI `/auth/register` |
| **No dedicated account/order-history page exists** | — | — | — | Auth/account features are limited to login and admin panel |
| `/{locale}/admin` | `app/[locale]/admin/(dashboard)/page.tsx` | App | Client | Admin dashboard with auth gate; stats cards; revenue chart; sidebar nav to all CRUD |

**Storefront static/info pages:**

| Page Path | File Path | Component Type | Data Source |
|-----------|----------|---------------|-------------|
| `/{locale}/` | `app/[locale]/page.tsx` | Mixed | `getPageData("home")` → CMS blocks |
| `/{locale}/about` | `app/[locale]/about/page.tsx` | Mixed | `getPageData("about")` → CMS blocks |
| `/{locale}/blog` | `app/[locale]/blog/page.tsx` | Client | Redux CMS pages |
| `/{locale}/contact` | `app/[locale]/contact/page.tsx` | Client | Contact form (POST to FastAPI) |
| `/{locale}/faq` | `app/[locale]/faq/page.tsx` | Client | `getPageData("faq")` |
| `/{locale}/services` | `app/[locale]/services/page.tsx` | Client | Generic/services content |

---

## 3. Product Fetching Logic

### 3.1 Existing Fetch Functions

| Name | File Path | Data Source | Endpoint / Query | Parameters | Response Shape (key fields) | Caching Strategy | Error Handling |
|------|-----------|-------------|-----------------|------------|----------------------------|-----------------|----------------|
| `getPageData(slug)` | `lib/getPageData.ts` | FastAPI (via proxy) | `GET {NEXT_PUBLIC_API_BASE_URL}/api/cms/pages?slug=<slug>` | `slug: string` | CMS page with `{ sections[], metaTitle, metaDescription, ... }` | React `cache()` | None (returns raw fetch response, no error wrapping) |
| `getSingleProduct(id)` | `lib/getPageData.ts` | FastAPI (via proxy) | `GET {NEXT_PUBLIC_API_BASE_URL}/api/commerce/products/<id>` | `id: string` (ObjectId or slug) | Product with variants, gallery, options, pricing | React `cache()` | None (returns `null` implicitly on failure) |
| `getTenantRegistry()` | `lib/getPageData.ts` | MongoDB | `db.collection("tenant_registry").findOne({ type: "branding" })` | None | `{ logos[], companyInfo, contactInfo, languages, ... }` | React `cache()` | None |
| `getBusinessBlueprint()` | `lib/getPageData.ts` | FastAPI (via proxy) | `GET {NEXT_PUBLIC_API_BASE_URL}/api/cms/business-blueprint` | None | `{ brandAssets: { colors, typography }, ... }` | React `cache()` | None |
| `fetchProducts()` (thunk) | `lib/store/products/productsThunk.ts` | Next.js API → MongoDB | `GET /api/commerce/products` | None (filters unused in thunk) | `{ data: ProductFormState[] }` — each has `{ _id, name, sku, slug, description, status, type, categoryIds[], attributeSetIds[], pricing, options[], variants[], gallery[], ... }` | No client cache (Redux `hasFetched` flag prevents re-fetch) | Sets `state.error` on rejection |
| `fetchProductsByCategory()` (thunk) | `lib/store/products/productsThunk.ts` | FastAPI | `GET {API_BASE_URL}/commerce/products?category=<id>&...filters` | `{ category: string, filters: object }` | Products with dedup (pushes only new `_id`s to array) | Redux `hasFetched` guard + dedup check per product ID | Sets `state.error` on rejection |
| `fetchProductById(id)` (thunk) | `lib/store/products/productsThunk.ts` | FastAPI | `GET {API_BASE_URL}/commerce/products/<id>` | `id: string` | Single product object | None (sets `state.currentProduct`) | Sets `state.error` on rejection |
| `saveProduct()` (thunk) | `lib/store/products/productsThunk.ts` | FastAPI | `POST {API_BASE_URL}/commerce/products` (create) / `PUT .../<id>` (update) | `{ id?: string, payload: any }` | Saved product | None | Sets `state.error` on rejection |
| `deleteProduct(id)` (thunk) | `lib/store/products/productsThunk.ts` | FastAPI | `DELETE {API_BASE_URL}/commerce/products/<id>` | `id: string` | Soft-delete (sets `status: "archived"` in local state) | None | Sets `state.error` on rejection |
| `GET /api/ecommerce/products` | `app/api/ecommerce/products/route.ts` | MongoDB | `products.aggregate([ $match filters, $lookup variants ])` | Query: `search`, `status`, `category` | `{ message, data: products[] }` with joined variants | Server-side (no cache headers set) | Returns 500 with error message on exception |
| `GET /api/ecommerce/products/[id]` | `app/api/ecommerce/products/[id]/route.ts` | MongoDB | `products.aggregate([ $match by _id or slug, $lookup variants ])` | ID param (hex or slug) | `{ message, data: product }` (single object) | None | Returns 404 / 500 |
| `POST /api/ecommerce/cart` | `app/api/ecommerce/cart/route.ts` | MongoDB | `carts.updateOne({ sessionId }, { $push/upsert })` | Body: `{ cartItemId, quantity, ...itemFields }` | `{ message, data: items[], status }` | None | Returns 500 with error message |
| `GET /api/ecommerce/cart` | `app/api/ecommerce/cart/route.ts` | MongoDB | `carts.findOne({ sessionId })` | Cookie: `cart_session_id` or `kalp_session` | `{ message, data: items[], status }` — with cart session/user merge | None | Returns empty items on error |

**API Route Auth Requirements:**

| Endpoint | Auth Required | Auth Method |
|----------|--------------|-------------|
| `GET /api/ecommerce/products` | No | — |
| `POST /api/ecommerce/products` | No | — |
| `PUT /api/ecommerce/products?id=` | No | — |
| `DELETE /api/ecommerce/products?id=` | No | — |
| `GET/PUT/DELETE /api/ecommerce/products/[id]` | PUT/DELETE require admin | `admin_token` JWT cookie |
| `POST /api/ecommerce/products/bulk` | No | — |
| `GET/POST/PUT/DELETE /api/ecommerce/cart` | No | Session-based (cookie) |
| `GET /api/ecommerce/orders` | Yes | `admin_token` JWT cookie |
| `POST /api/ecommerce/orders` | Yes | `admin_token` JWT cookie |
| `PUT /api/ecommerce/orders/[id]` | Yes | `admin_token` JWT cookie |
| `GET /api/ecommerce/variants` | Yes | `admin_token` JWT cookie |
| `GET/POST/PUT/DELETE /api/ecommerce/attributes` | POST/PUT/DELETE have no check (inconsistent) | — |
| `POST /api/ecommerce/attributes/bulk` | Yes | `admin_token` JWT cookie |
| `POST /api/ecommerce/categories/bulk` | Yes | `admin_token` JWT cookie |
| `POST /api/ecommerce/upload` | Yes | `admin_token` JWT cookie |

### 3.2 Data Models

**Product (MongoDB `products` collection + Redux `ProductFormState`):**

```typescript
interface ProductFormState {
  _id?: string;                    // MongoDB ObjectId
  name: string;                    // Product name/title
  sku: string;                     // Stock keeping unit
  slug: string;                    // URL-friendly identifier
  description: string;             // Rich text description
  status: "active" | "draft" | "archived";
  type: "physical";                // Product type (extensible)
  categoryIds: string[];           // References to categories
  attributeSetIds: string[];       // References to attribute_sets
  pricing: {
    price: string;                 // Main selling price
    compareAtPrice: string;        // Original/comparison price
    costPerItem: string;           // Cost price
    chargeTax: boolean;
    trackQuantity: boolean;
  };
  options: ProductOption[];        // Configurable options (size, color, etc.)
  variants: VariantRow[];          // SKU-level variant combinations
  gallery: ProductGalleryItem[];   // Images [{ id, url, alt }]
  primaryImageId: string;          // Default image reference
  primaryCategoryId: string;       // Main category
  relatedProductIds: string[];     // Cross-sell / upsell
  templateKey: string;             // Layout template (e.g. "product-split")
  price?: string;                  // Legacy fallback
}
```

**Variant (`VariantRow`):**

```typescript
interface VariantRow {
  _id?: string;
  productId?: string;
  key: string;                    // "Color:Red|Size:M" (pipe-separated option key:value pairs)
  title: string;                  // "Red / M"
  sku: string;
  price: string;
  compareAtPrice?: string;
  stock?: number;
  status: "active" | "inactive";
  imageId?: string;
}
```

**ProductOption:**

```typescript
interface ProductOption {
  id: string;
  name: string;
  key: string;
  values: string[];               // ["Red", "Blue", "Green"]
  useForVariants?: boolean;       // false = display only
  position?: number;
}
```

**Category (MongoDB `categories` collection):**

```typescript
interface Category {
  _id?: ObjectId | string;
  name: string;
  slug: string;
  parentId?: string;              // For subcategories
  description?: string;
  image?: string;
  type?: string;                  // Used as query filter
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Cart (MongoDB `carts` collection):**

```typescript
interface CartDocument {
  _id: ObjectId;
  sessionId?: string;             // Guest users (UUID v4)
  userId?: ObjectId;              // Authenticated users
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  _id: string;                    // Product _id
  name: string;
  sku: string;
  price: string;
  quantity: number;
  selectedOptions: Record<string, string>;  // { Color: "Red", Size: "M" }
  selectedVariant: VariantRow | null;
  cartItemId: string;             // `${productId}-${variantKey}`
  gallery: ProductGalleryItem[];
  primaryImageId: string;
  primaryCategoryId: string;
}
```

**CMS Page — Core Interfaces:**

Every page is composed of sections. Each section is a `PageBlock` whose `content` may contain nested blocks or `ContentItem` elements. Data is authored via the admin CMS (JSON-driven) and rendered by merging CMS data with static defaults.

```typescript
export interface ContentItem {
  id?: string;
  type: string;                     // "heading" | "paragraph" | "image" | "button" | "carousel" | "cards" | "list" | "section" | "cta"
  props?: any;                      // Localized { en, hi } values
  content?: any[];
  _id?: string;
}

export interface PageBlock {
  id: string;
  type: string;                     // "section"
  props?: any;                      // Section-level settings (localized)
  content?: (PageBlock | ContentItem | any)[];  // Child blocks or content items
  columns?: any[][];                // Multi-column layout cells
  adminTitle?: string;              // Unique identifier used by getSection() to extract this block
  layout?: string;                  // "grid-1" | "grid-2" | "grid-3" | "grid-4" | "fullwidth"
}

export interface Page {
  id?: string;
  _id?: string;
  title: Record<string, string>;    // Localized title { en, hi }
  tenant_id?: string;
  slug?: string;
  content?: PageBlock[] | string | any;  // Top-level sections array
  isPublished?: boolean;
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  status?: string;
  type?: string;
  template?: string;
  sections?: any[];
  seo?: { metaTitle?: Record<string, string>; metaDescription?: Record<string, string> };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isHomepage?: boolean;
}
```

**Rendering pattern — each section component follows:**
```typescript
// Extract the section PageBlock from the page by adminTitle
const section = currentPages?.content?.find(
  (s: any) => s?.adminTitle === "Section Title"
);

// Merge CMS data with static JSON defaults
const props = (section as any)?.props || defaultData.props;
const content = (section as any)?.content || defaultData.content;
```

The `Page.content` array holds top-level `PageBlock` sections. Each section's `content` follows `content?: (PageBlock | ContentItem | any)[]`, allowing arbitrary nesting. Data files (`*Data.ts`) provide static fallback JSON matching the same shape so pages render even without CMS data.

**Default language: English only.** Although data files may include `{ en, hi }` objects, the middleware (`middleware.ts`) enforces single-language mode with `locales = ["en"]`. Non-English locale prefixes (e.g. `/hi`, `/fr`) are redirected to clean English URLs. All localized value helpers (`getV`) fall back to `val.en` when the requested locale is missing. Pages should be authored with `"en"` as the default language — the `"hi"` keys are present in data files but are never served at runtime due to middleware enforcement.

**Order (MongoDB `orders` collection — admin only, no public order creation):**

```typescript
interface Order {
  _id: ObjectId;
  status: string;
  notes?: string;
  shippingAddress?: object;
  createdAt: Date;
  updatedAt: Date;
  // Items and user data are not stored in the current schema
  // (checkout is a frontend prototype — no order is persisted)
}
```

---

### 3.3 Authentication Flow

**Dual login endpoints:**

| Endpoint | Used By | Backend | Mechanism |
|----------|---------|---------|-----------|
| `POST {API_BASE_URL}/auth/login` | Client `loginThunk` (login page) | FastAPI | `credentials: "include"` → FastAPI sets `auth_token` httpOnly cookie |
| `POST /api/login` | Server-side / direct (available but **not** used by login page) | Next.js + MongoDB | bcrypt compare → `jwt.sign()` → `serialize("auth_token", token)` httpOnly cookie |

**JWT payload:** `{ id, email, role, isTenantOwner, name }` — expires in 1 day. Cookie config: `httpOnly`, `sameSite: "strict"`, `secure` in production, `path: "/"`.

**Already-logged-in behavior:**

- **Login page (`/login`):** ❌ No guard. The page renders the login form regardless of auth state. There is no `isAuthenticated` check from Redux, no server-side cookie check, and no redirect. An authenticated user navigating to `/login` will see the form and can re-authenticate.
- **Admin panel (`/admin/*`):** ✅ Guarded. `dashboard/layout.tsx` (server component) reads `auth_token` cookie, calls `getAuthUser(token)` → FastAPI `/auth/me`. If the token is missing or invalid → `redirect("/login")`. If `user.role === "customer"` → `redirect("/")`.
- **Storefront root layout (`app/[locale]/layout.tsx`):** ✅ Hydrates user. Reads `auth_token` cookie server-side, fetches user via `getAuthUser(token)` (if token present), passes to `<GetUser user={user} />` which dispatches `setCredentials()` into Redux on mount. This populates `state.auth.isAuthenticated` and `state.auth.user`.

**Auth state in Redux** (`authSlice`):
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;     // true after loginThunk.fulfilled
  isLoading: boolean;
  error: string | null;
}
```

**Logout:** `DELETE /api/login` clears the `auth_token` cookie by setting `maxAge: 0`. Dispatched via `logoutThunk`.

**Important:** The client-side `loginThunk` hits the **FastAPI backend** (`/auth/login`), while a separate standalone Next.js route at `app/api/login/route.ts` also handles login via direct MongoDB + bcrypt. These are two independent login endpoints — the Next.js route is not used by the login page UI.

---

## 4. Required Methods for New Website

For each method, `Implementation Suggestion` indicates where the logic should live in a Next.js App Router project:
- **Server Action** (`'use server'` in `lib/actions/`) — direct DB mutation from server component
- **API Route** (`app/api/.../route.ts`) — HTTP endpoint for client-side calls
- **Client Hook** (`hooks/` or inline) — thin wrapper around fetch or Redux dispatch
- **Server Component** — inline async data fetch with React `cache()`

### 4.1 Product Methods

#### `getProducts`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch paginated, filtered, sorted product list |
| **Input** | `{ search?: string, categoryIds?: string[], status?: string, sort?: string, page?: number, limit?: number }` |
| **Return** | `{ data: Product[], total: number, page: number, totalPages: number }` |
| **Implementation** | **API Route** (`app/api/products/route.ts`). Adapt the existing `aggregate([ $match, $lookup variants, $skip, $limit, $sort ])` from `app/api/ecommerce/products/route.ts`. Add pagination (`$facet` for total count + data). |
| **Notes** | Reuse existing MongoDB aggregation pipeline. Add `$sort` support (price asc/desc, newest, name). Add `$facet` for paginated results with total count. Consider adding `$lookup` for categories to return category names alongside. |

#### `getProductBySlug`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch single product by URL slug |
| **Input** | `slug: string` |
| **Return** | `Product | null` |
| **Implementation** | **Server Action** or **API Route**. Reuse logic from `app/api/ecommerce/products/[id]/route.ts` which already handles both hex ObjectId and slug strings. |
| **Notes** | Add active/inactive status filtering. The existing `getPageData.ts` function `getSingleProduct(id)` uses FastAPI — for the new site, use MongoDB directly for lower latency. Wrap with React `cache()`. |

#### `getProductById`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch single product by MongoDB ObjectId (admin use) |
| **Input** | `id: string` |
| **Return** | `Product \| null` |
| **Implementation** | **API Route** (`app/api/products/[id]/route.ts`). Reuse existing `app/api/ecommerce/products/[id]/route.ts` GET handler. |
| **Notes** | Add admin auth check. The existing route already supports this. |

#### `getRelatedProducts`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch related/cross-sell products for a product detail page |
| **Input** | `{ productId: string, limit?: number }` |
| **Return** | `Product[]` |
| **Implementation** | **API Route** or **Server Component**. Query products sharing the same `primaryCategoryId` or matching `relatedProductIds` from the source product. Exclude the source product itself. |
| **Notes** | New feature (not in existing codebase). The product schema has `relatedProductIds` but no thunk to fetch them. Use `$match: { categoryIds: { $in: sourceCategoryIds }, _id: { $ne: sourceId } }` with `$limit`. |

#### `getProductVariants`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch all variant combinations for a product |
| **Input** | `productId: string` |
| **Return** | `VariantRow[]` |
| **Implementation** | **Server Component** (inline). Query `variants` collection with `productId` filter. The product aggregation already joins variants via `$lookup` — variants are typically returned together with the product. |
| **Notes** | Variants are already embedded in the product fetch (via `$lookup`). A standalone variant fetch is only needed if variants are stored separately. |

#### `getProductReviews`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch product reviews/ratings |
| **Input** | `productId: string, page?: number, limit?: number` |
| **Return** | `{ data: Review[], total: number, average: number }` |
| **Implementation** | **New API Route** (`app/api/products/[id]/reviews/route.ts`). Create a `reviews` MongoDB collection with `{ productId, userId, rating, title, body, createdAt }`. |
| **Notes** | ⚠️ **Not in existing codebase.** The static mock data has `rating` and `reviews` count fields on products, but there is no review system. If needed, build from scratch. |

### 4.2 Category & Collection Methods

#### `getCategories`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch all categories (optionally filtered by type) |
| **Input** | `{ type?: string, parentId?: string }` |
| **Return** | `Category[]` |
| **Implementation** | **API Route** (`app/api/categories/route.ts`). Reuse existing `app/api/ecommerce/categories/route.ts` GET handler which supports `type` filter. |
| **Notes** | Add `parentId` filter for hierarchical categories. The existing schema supports `parentId` but the filter is not implemented. |

#### `getCollectionBySlug`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch a single category/collection by slug |
| **Input** | `slug: string` |
| **Return** | `Category \| null` |
| **Implementation** | **API Route** (`app/api/categories/[slug]/route.ts`). New route. Query `categories.findOne({ slug })`. |
| **Notes** | Categories currently support hex ID or string ID lookup but not slug. This is needed for clean URL-based category pages. |

#### `getProductsByCategory`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch products filtered by category ID, with pagination |
| **Input** | `{ categoryId: string, page?: number, limit?: number, sort?: string, filters?: object }` |
| **Return** | `{ data: Product[], total: number, page: number }` |
| **Implementation** | **API Route** (`app/api/products/route.ts` with `?categoryId=` param). Extend the existing `getProducts` aggregation with `$match: { categoryIds: categoryId }`. |
| **Notes** | The existing `fetchProductsByCategory` thunk hits FastAPI directly. Move to MongoDB direct query for lower latency. Reuse the same aggregation pipeline as `getProducts` with the category filter added. |

### 4.3 Search & Filter Methods

#### `searchProducts`

| Property | Value |
|----------|-------|
| **Purpose** | Full-text search across product names, descriptions, SKUs |
| **Input** | `{ query: string, page?: number, limit?: number }` |
| **Return** | `{ data: Product[], total: number, page: number }` |
| **Implementation** | **API Route** (extend `app/api/products/route.ts`). Add `$match` with `$or: [ { name: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }, { sku: { $regex: query, $options: "i" } } ]`. |
| **Notes** | The existing `GET /api/ecommerce/products` already supports `search` param with regex on `name`. Extend to include description and SKU. For production, consider MongoDB Atlas Search ($text index) for better performance. |

#### `applyFilters`

| Property | Value |
|----------|-------|
| **Purpose** | Filter products by price range, attributes, status, etc. |
| **Input** | `{ minPrice?: number, maxPrice?: number, status?: string, attributeValues?: Record<string, string[]>, categoryIds?: string[] }` |
| **Return** | MongoDB `$match` stage (composable) |
| **Implementation** | **Utility function** in `lib/filters.ts`. Build the MongoDB `$match` stage dynamically by composing filter conditions. Each filter is optional. |
| **Notes** | Not a standalone endpoint — used inside `getProducts` / `getProductsByCategory`. Build as a composable utility. The existing code does basic filtering but lacks price range and attribute value filters. |

#### `applySorting`

| Property | Value |
|----------|-------|
| **Purpose** | Apply sort order to product queries |
| **Input** | `{ sort: "price_asc" \| "price_desc" \| "newest" \| "name_asc" \| "name_desc" \| "best_selling" }` |
| **Return** | MongoDB `$sort` stage |
| **Implementation** | **Utility function** in `lib/filters.ts`. Map sort keys to `{ field: direction }` objects. |
| **Notes** | Existing code has no sorting implementation. Best-selling requires an orders/products join or a `soldCount` field on products. |

### 4.4 Cart & Checkout Methods

#### `getCart`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch the current user's/session's cart with all items |
| **Input** | (implicit: session cookie or auth token) |
| **Return** | `CartItem[]` |
| **Implementation** | **API Route** (`app/api/cart/route.ts`). Reuse existing `app/api/ecommerce/cart/route.ts` GET handler. Sessions via `cart_session_id` cookie; user merge via `kalp_session` JWT. |
| **Notes** | The existing implementation is solid. Maintain the session→user merge logic. Consider adding a `$lookup` to products to refresh prices/stocks. |

#### `addToCart`

| Property | Value |
|----------|-------|
| **Purpose** | Add a product variant to the cart (or increment quantity if already present) |
| **Input** | `{ productId: string, variantKey: string, quantity: number, selectedOptions: Record<string, string> }` |
| **Return** | `{ items: CartItem[], status: string }` |
| **Implementation** | **API Route** (`POST /api/cart`). Reuse existing `app/api/ecommerce/cart/route.ts` POST handler. Uses `cartItemId = `${productId}-${variantKey}`` for dedup. |
| **Notes** | Dedup logic works by matching `cartItemId` and incrementing quantity. |

#### `updateCartItem`

| Property | Value |
|----------|-------|
| **Purpose** | Update quantity of a cart item (or remove if quantity ≤ 0) |
| **Input** | `{ cartItemId: string, quantity: number }` |
| **Return** | `{ items: CartItem[], status: string }` |
| **Implementation** | **API Route** (`PUT /api/cart`). Reuse existing `app/api/ecommerce/cart/route.ts` PUT handler. |
| **Notes** | Quantity ≤ 0 triggers item removal via `splice`. |

#### `removeFromCart`

| Property | Value |
|----------|-------|
| **Purpose** | Remove a single item from cart (by cartItemId) or clear entire cart |
| **Input** | `{ cartItemId?: string, clear?: boolean }` |
| **Return** | `{ items: CartItem[], status: string }` |
| **Implementation** | **API Route** (`DELETE /api/cart`). Reuse existing `app/api/ecommerce/cart/route.ts` DELETE handler. |
| **Notes** | Supports both single-item removal and full cart clear. |

#### `applyCoupon`

| Property | Value |
|----------|-------|
| **Purpose** | Validate and apply a discount coupon/promo code |
| **Input** | `{ code: string, cartTotal: number }` |
| **Return** | `{ valid: boolean, discount: number, message: string }` |
| **Implementation** | **API Route** (`POST /api/cart/coupon`). Create new `coupons` MongoDB collection with `{ code, type: "percentage"|"fixed", value, minCartValue, maxUses, expiresAt }`. |
| **Notes** | ⚠️ **Not in existing codebase.** New feature. Must create coupon data model. Redux cart does not currently track applied discounts. |

#### `createCheckoutSession` / `createOrder`

| Property | Value |
|----------|-------|
| **Purpose** | Convert cart items into a persisted order (actual checkout) |
| **Input** | `{ shippingAddress: Address, paymentMethod: string, items: CartItem[], totals: { subtotal, tax, shipping, total } }` |
| **Return** | `{ orderId: string, status: "confirmed" }` |
| **Implementation** | **API Route** (`POST /api/orders`). Insert into `orders` collection. Clear cart. Create a new orders schema that includes items, user info, shipping, payment, and totals. |
| **Notes** | ⚠️ **NOT in existing codebase.** The checkout page is a UI prototype with no backend integration. This is the most critical missing feature. Order schema must be designed from scratch. |

### 4.5 User & Order Methods

#### `getUserProfile`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch authenticated user's profile |
| **Input** | (implicit: JWT from cookie) |
| **Return** | `{ id, name, email, role, createdAt }` |
| **Implementation** | **API Route** (`GET /api/auth/me`). The existing code fetches from FastAPI `/auth/me`. For new site, implement directly in Next.js: verify JWT cookie → query `users` collection. |
| **Notes** | Users are stored in `kalp_master` database (`masterDB.collection("users")`). Reuse JWT verification from `lib/auth.ts`. |

#### `getOrderHistory`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch authenticated user's past orders |
| **Input** | `{ page?: number, limit?: number }` |
| **Return** | `{ data: Order[], total: number, page: number }` |
| **Implementation** | **API Route** (`GET /api/orders`). Query `orders` collection filtered by `userId` (from JWT). Sort by `createdAt: -1`. |
| **Notes** | ⚠️ Requires `createOrder` to be implemented first (orders don't exist yet beyond admin listing). The existing `/api/ecommerce/orders/` route is admin-only and lists all orders — create a separate user-facing route that filters by `userId`. |

#### `getWishlist`

| Property | Value |
|----------|-------|
| **Purpose** | Fetch the user's wishlist/saved items |
| **Input** | (implicit: JWT or session) |
| **Return** | `Product[]` (or `string[]` of product IDs) |
| **Implementation** | **API Route** (`GET /api/wishlist`). Create a new `wishlists` MongoDB collection with `{ userId/sessionId, productIds: string[] }`. There is a `wishlist` Redux slice already but it has minimal implementation. |
| **Notes** | ⚠️ **Stub only in existing codebase.** The Redux `wishlistSlice` exists but no API routes or thunks are connected. Must be built from scratch. |

---

## 5. Implementation Recommendations

### 5.1 Suggested Folder Structure

```
app/
  api/
    products/
      route.ts              # GET (list with filters/pagination) / POST (create)
      [id]/route.ts          # GET (single) / PUT (update) / DELETE
      [id]/reviews/
        route.ts             # GET (reviews) / POST (add review)
    categories/
      route.ts              # GET (list) / POST (create)
      [slug]/route.ts       # GET (single by slug)
    cart/
      route.ts              # GET / POST / PUT / DELETE
      coupon/
        route.ts            # POST (apply)
    orders/
      route.ts              # GET (user's orders) / POST (create)
      [id]/route.ts         # GET (single order detail)
    wishlist/
      route.ts              # GET / POST / DELETE
    auth/
      me/
        route.ts            # GET (user profile)
      login/
        route.ts            # POST
      register/
        route.ts            # POST

lib/
  actions/
    products.ts             # Server actions for product mutations
    cart.ts                 # Server actions for cart operations
    orders.ts               # Server actions for checkout flow
  db.ts                     # MongoDB connection (reuse existing)
  auth.ts                   # JWT utils (reuse existing)
  filters.ts                # Composable filter/sort builders
  models.ts                 # Collection accessors (adapt from models/index.ts)
  validations.ts            # Zod schemas for all inputs

hooks/
  useCart.ts                # Client hook wrapping cart Redux + API
  useProducts.ts            # Client hook for product queries
  useWishlist.ts            # Client hook for wishlist
```

### 5.2 Recommended Patterns

| Concern | Pattern | Rationale |
|---------|---------|-----------|
| **Product list queries** | **API Route** | Pagination, filtering, and sorting are complex — an API route keeps the aggregation pipeline on the server and delivers only the data needed |
| **Single product fetch** | **Server Component** (inline `cache()`) | Fast, SEO-friendly. Use React `cache()` for dedup within a render pass. Used successfully in existing `getPageData.ts` |
| **Cart mutations** | **API Route** | Cart needs session/user detection via cookies — API routes can read cookies natively. Server actions can too, but API routes are more RESTful |
| **Auth** | **API Route** (FastAPI `/auth/*`) + **httpOnly cookies** (also has Next.js route at `/api/login`) | dual login endpoints exist: (1) client `loginThunk` → FastAPI `/auth/login`, (2) server `POST /api/login` → direct MongoDB + bcrypt. JWT stored in `auth_token` httpOnly cookie (1-day expiry). Admin layout (`dashboard/layout.tsx`) verifies token server-side via `getAuthUser(token)` → FastAPI `/auth/me`; unauthenticated → redirect `/login`. Root layout (`[locale]/layout.tsx`) also reads cookie and hydrates Redux via `<GetUser>`. **No guard on `/login`**: already-authenticated users see the form with no redirect. |
| **Client state** | **React Context** or **zustand** (lightweight) | The existing Redux store is large (16 slices). For a new site, consider a lighter approach: React Query/SWR for server state, zustand for local UI state |
| **Server cache** | React `cache()` + `next.revalidate` | Match existing pattern (`getPageData.ts`). For ISR/preview, add `revalidate` tags to fetch calls |
| **Form validation** | **zod + react-hook-form** (reuse existing pattern) | Already used in admin forms. Works well for checkout, account forms, etc. |
| **Error handling** | Try/catch in every server action + API route; return `{ success, error, data }` envelope | Existing code has inconsistent error handling. Standardize on a response envelope pattern |

### 5.3 Existing Patterns Worth Reusing

| Pattern | Where | Why |
|---------|-------|-----|
| `connectTenantDB()` | `lib/db.ts` | Clean singleton MongoDB connection with multi-tenant support |
| `authenticateAdmin()` | `lib/auth.ts` | JWT cookie verification — adapt for general user auth |
| Cart session/user merge | `app/api/ecommerce/cart/route.ts` | Seamless guest→logged-in cart transition. Well-implemented |
| `composeVariantKey` / variant dedup | `lib/store/cart/cartSlice.ts` | Clean logic to map product+options to unique cart item key |
| Product aggregation with `$lookup` | `app/api/ecommerce/products/route.ts` | Efficient single-query product+variants fetch |
| `generateVariantsFromOptions()` | `lib/commerce.ts` | Cartesian product variant generation from option sets |
| Multi-tenant header propagation | `lib/apiProxy.ts` | Standardize on `x-tenant-db` header for database isolation |

### 5.4 Critical Gaps in Existing Codebase

| Gap | Impact | Priority |
|-----|--------|----------|
| **No actual order persistence** | Checkout is a UI prototype — no order is created, no payment, no confirmation | 🔴 **Critical** |
| **No user-facing order history** | Users cannot view past purchases | 🔴 High |
| **No product search page** | Only a header search that filters static mock data | 🟡 Medium |
| **No price range filter** | Shop page has a `PriceRangeFilter` component but no backend integration | 🟡 Medium |
| **No coupon/discount system** | Cart has no promo code input | 🟡 Medium |
| **No product reviews/ratings** | Static mock data shows ratings but no review system | 🟢 Low |
| **Wishlist is a stub** | Redux slice exists but no API routes or persistence | 🟢 Low |
| **No sorting on product list** | Shop/category pages have no sort controls | 🟢 Low |
| **Inconsistent auth on API routes** | Some routes require admin, some don't (even mutations) | 🟡 Medium |
| **Hardcoded tenant header** | `x-tenant-db: "kp_nestcraft"` is hardcoded in thunks | 🟢 Low |

---

*Generated from analysis of `/Users/manishgupta/Desktop/Project/nestcraft-living/Untitled`*
