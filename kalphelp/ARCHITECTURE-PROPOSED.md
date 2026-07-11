# Proposed Architecture — NestCraft Living

## 1. Page Pattern (Every Page)

```
app/[locale]/
├── page.tsx              # Server Component — fetch data + generateMetadata
├── loading.tsx           # Skeleton loader
├── error.tsx             # Error boundary
└── _components/          # Page-specific client components (co-located)
```

Every public page must:
- Be a **Server Component** (no `"use client"`)
- Export `generateMetadata` for SEO (title, description, OG tags)
- Fetch initial data server-side (via `React.cache()` wrapped functions)
- Pass data as props to a client child **only** when interactivity is needed
- Include `loading.tsx` and `error.tsx`

---

## 2. Current vs Proposed

| Concern | Current | Proposed |
|---|---|---|
| **Page type** | 12 server + 24 client — mixed, inconsistent | Every page = thin server component. `"use client"` only on leaf interactive components |
| **SEO metadata** | Only 3 pages have `generateMetadata` (home, about, ecommerce) | Every public page: contact, services, blog, shop, category, product, FAQ, cart, checkout, login, signup, account, orders, wishlist |
| **Data fetching** | Split across 3 patterns: server `getPageData`, Redux thunks, `useEffect`+`fetch` | **Single pattern**: initial data fetched server-side → passed as props. Client only refetches on user action (pagination, filter, mutation) |
| **Redux prefetch** | `<FetchAllData />` in layout fires 10+ thunks on every navigation | Remove layout-level prefetch. Each page fetches only what it needs. Lazy-load Redux data |
| **StoreProvider** | Nested — admin layout wraps its own `<StoreProvider>` inside locale layout's | Single `<StoreProvider>` at root layout. Admin layout only checks auth |
| **Client pages** | login, signup, account, orders, wishlist, cart, checkout, all admin — all `"use client"` | These become **server pages** that pass initial data down. `"use client"` only for interactive leaf components |
| **Loading/error** | No `loading.tsx` or `error.tsx` on most routes | Every route segment has both |
| **Component org** | Flat `components/pages/` — 18 files, mixed server/client | Co-locate page components under `app/[locale]/page-name/_components/` |
| **Data fetching lib** | 3+ functions, some cached, some not | Unified `getPageData(type)` with `React.cache()`. Server fetches use `fetch` + `next: { revalidate }`. Client mutations go through a thin API layer |

---

## 3. Proposed File Structure

```
app/
├── layout.tsx                # Root layout — <html>, <body>, single <StoreProvider>
├── [locale]/
│   ├── layout.tsx            # Locale shell — BrandingInitializer, ThemeInitializer, LayoutWrapper
│   ├── page.tsx              # Home (server) — getPageData("home"), generateMetadata
│   ├── loading.tsx
│   ├── error.tsx
│   ├── about/
│   │   ├── page.tsx          # Server — getPageData("about"), generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── contact/
│   │   ├── page.tsx          # Server — generateMetadata
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/      # ContactForm, ContactHero, FAQ — client components
│   ├── shop/
│   │   ├── page.tsx          # Server — getProducts(), generateMetadata
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── _components/      # ProductGrid, Filters, Pagination
│   ├── product/
│   │   └── [id]/
│   │       ├── page.tsx      # Server — getProductBySlug(), generateMetadata
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       └── _components/  # Gallery, VariantSelector, AddToCart
│   ├── account/
│   │   ├── page.tsx          # Server (check auth cookie) → AccountClient
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── orders/
│   │   ├── page.tsx          # Server — getOrders(user), generateMetadata
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── cart/
│   │   ├── page.tsx          # Server — getCart(), generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── checkout/
│   │   ├── page.tsx          # Server — generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── login/
│   │   ├── page.tsx          # Server — generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── signup/
│   │   ├── page.tsx          # Server — generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── blog/
│   │   ├── page.tsx          # Server — getPageData("blog"), generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── services/
│   │   ├── page.tsx          # Server — generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── faq/
│   │   ├── page.tsx          # Server — getPageData("faq"), generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── wishlist/
│   │   ├── page.tsx          # Server — getWishlist(user), generateMetadata
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── admin/
│       └── (dashboard)/
│           ├── layout.tsx    # Auth gate (server) — no StoreProvider, just verify JWT
│           ├── page.tsx      # Server
│           ├── loading.tsx
│           └── ...
```

---

## 4. Data Fetching Standards

### Server-Side (in page.tsx)
```tsx
// lib/fetch.ts
import { cache } from "react"

export const getPageData = cache(async (slug: string) => {
  const res = await fetch(`${API_URL}/cms/pages?slug=${slug}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  return res.json()
})
```

### Client-Side (only for mutations / user-initiated actions)
```tsx
// hooks/useCart.ts — thin wrapper around fetch, NOT Redux thunk
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const addItem = async (productId: string, qty: number) => {
    const res = await fetch("/api/cart", { method: "POST", body: JSON.stringify({ productId, qty }) })
    setItems(await res.json())
  }
  return { items, addItem }
}
```

### Rules
| Scenario | Fetch at | Mechanism |
|---|---|---|
| Initial page data | Server | `cache()` + `fetch()` |
| Pagination / filters | Client | `fetch()` with `useEffect` or SWR |
| Mutations (add to cart, checkout) | Client | `fetch()` POST/PUT/DELETE |
| Admin CRUD | Client | API routes (keep existing) |

---

## 5. SEO Requirements

Every public page (not admin) must export:
```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPageData(slug)
  return {
    title: data?.metaTitle?.[locale] ?? "Default Title | NestCraft",
    description: data?.metaDescription?.[locale] ?? "Default description",
    openGraph: {
      title: data?.metaTitle?.[locale],
      description: data?.metaDescription?.[locale],
    },
  }
}
```

### Pages missing `generateMetadata` (to add):
- contact, services, blog, shop, category, category/[id], product/[id], faq, cart, checkout, login, signup, account, orders, orders/[id], wishlist

---

## 6. Layout Architecture (Proposed)

```
app/layout.tsx (root)
└── <StoreProvider>           ← Single instance, wraps entire app
    └── <body>{children}</body>

app/[locale]/layout.tsx
├── BrandingInitializer        ← Server data passed as props (no fetch inside client)
├── ThemeInitializer
├── LayoutWrapper (header, footer)
│   └── {children}            ← Page content
│       ├── loading.tsx       ← Suspense boundary
│       └── error.tsx         ← Error boundary

app/[locale]/admin/(dashboard)/layout.tsx
├── Auth gate (server)         ← Read cookie, verify JWT, redirect if invalid
├── Sidebar
├── AdminHeader
└── {children}
    ├── loading.tsx
    └── error.tsx
```

**No nested StoreProvider.** Admin routes use the same provider from root layout.

---

## 7. Redux Reduction

| Current (20 slices) | Proposed | Reason |
|---|---|---|
| `auth` | **Keep** | User session state |
| `cart` | **Remove** → Server + `fetch()` | Cart data fetched server-side, mutations via API |
| `orders` | **Remove** → Server + `fetch()` | Orders fetched server-side |
| `wishlist` | **Remove** → Server + `fetch()` | Wishlist fetched server-side |
| `pages` | **Keep** | CMS pages in memory for editing |
| `menus` | **Keep** | Navigation menus |
| `adminProducts` | **Keep** | Admin CRUD state |
| `adminCategories` | **Keep** | Admin CRUD state |
| `adminAttributes` | **Keep** | Admin CRUD state |
| `adminVariants` | **Keep** | Admin CRUD state |
| `adminOrders` | **Keep** | Admin CRUD state |
| `adminUsers` | **Keep** | Admin CRUD state |
| `adminForms` | **Keep** | Admin CRUD state |
| `websiteDetail` | **Keep** or merge into `branding` | Tenant config |
| `branding` | **Keep** | Branding/theme |
| `businessBlueprint` | **Keep** | Business config |
| `comments` | **Keep** | Annotation plugin |
| `forms` | **Keep** | Dynamic forms |

**Keep Redux for admin (heavy CRUD).** Reduce public store to auth + branding + menus.

---

## 8. Key Wins Summary

| Area | Impact |
|---|---|
| **SEO** | Every page gets unique title/description/OG tags → search ranking |
| **Performance** | No redundant data fetching on navigation, smaller client bundles |
| **Bundle size** | 24 pages converted from client → server = dramatically less JS |
| **Maintainability** | One data-fetching pattern instead of three |
| **UX** | Loading boundaries, error boundaries at every route |
| **Auth** | Single StoreProvider, no nesting issues |
