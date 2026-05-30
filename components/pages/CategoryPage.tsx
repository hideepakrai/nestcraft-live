// "use client";

// import React, { useState, useMemo } from "react";
// import { Link, useParams } from "@/lib/router";
// import {
//   Star,
//   Search,
//   Plus,
//   ChevronRight,
//   Filter,
//   Heart,
//   Eye,
// } from "lucide-react";
// import { products, categories } from "../../data/products";
// import { useAppDispatch } from "../../lib/store/hooks";
// import { addToCart } from "../../lib/store/features/cartSlice";
// import { RootState } from "@/lib/store/store";
// import { useSelector } from "react-redux";
// import { AnnotatorPlugin } from "../annotationPlugin/AnnotatorPlugin";
// import GetAllPages from "./GetAllPages";

// /* ─── Price Range Slider ─────────────────────────────────── */
// const MIN_PRICE = 0;
// const MAX_PRICE = 200000;

// const PriceRangeFilter = () => {
//   const [minVal, setMinVal] = useState(MIN_PRICE);
//   const [maxVal, setMaxVal] = useState(MAX_PRICE);

//   const minPercent = ((minVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
//   const maxPercent = ((maxVal - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

//   return (
//     <div className="p-4 border-b border-border/70">
//       <div className="text-[11px] font-black uppercase tracking-[2px] text-foreground/80 mb-3">
//         Price
//       </div>

//       {/* Min / Max input boxes */}
//       <div className="grid grid-cols-2 gap-2.5 mb-4">
//         <input
//           type="number"
//           placeholder="Min"
//           value={minVal}
//           min={MIN_PRICE}
//           max={maxVal - 500}
//           onChange={(e) => {
//             const val = Math.min(Number(e.target.value), maxVal - 500);
//             setMinVal(Math.max(val, MIN_PRICE));
//           }}
//           className="h-10 px-3 rounded-xl border border-border bg-background/80 text-xs font-bold outline-none focus:border-secondary w-full"
//         />
//         <input
//           type="number"
//           placeholder="Max"
//           value={maxVal}
//           min={minVal + 500}
//           max={MAX_PRICE}
//           onChange={(e) => {
//             const val = Math.max(Number(e.target.value), minVal + 500);
//             setMaxVal(Math.min(val, MAX_PRICE));
//           }}
//           className="h-10 px-3 rounded-xl border border-border bg-background/80 text-xs font-bold outline-none focus:border-secondary w-full"
//         />
//       </div>

//       {/* Dual-handle track */}
//       <div className="relative h-1.5 rounded-full bg-border mx-1">
//         {/* Active fill */}
//         <div
//           className="absolute h-full rounded-full bg-secondary"
//           style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
//         />

//         {/* Min thumb */}
//         <input
//           type="range"
//           min={MIN_PRICE}
//           max={MAX_PRICE}
//           step={500}
//           value={minVal}
//           onChange={(e) => {
//             const val = Math.min(Number(e.target.value), maxVal - 500);
//             setMinVal(val);
//           }}
//           className="price-thumb"
//         />

//         {/* Max thumb */}
//         <input
//           type="range"
//           min={MIN_PRICE}
//           max={MAX_PRICE}
//           step={500}
//           value={maxVal}
//           onChange={(e) => {
//             const val = Math.max(Number(e.target.value), minVal + 500);
//             setMaxVal(val);
//           }}
//           className="price-thumb"
//         />
//       </div>

//       <style>{`
//         .price-thumb {
//           position: absolute;
//           inset: 0;
//           width: 100%;
//           height: 100%;
//           opacity: 0;
//           cursor: pointer;
//           pointer-events: all;
//           -webkit-appearance: none;
//           appearance: none;
//           margin: 0;
//         }
//         .price-thumb::-webkit-slider-thumb {
//           -webkit-appearance: none;
//           appearance: none;
//           width: 18px;
//           height: 18px;
//           border-radius: 50%;
//           background: #fff;
//           border: 2.5px solid var(--color-secondary, #6fba44);
//           box-shadow: 0 1px 6px rgba(0,0,0,0.18);
//           cursor: grab;
//           pointer-events: all;
//         }
//         .price-thumb::-moz-range-thumb {
//           width: 18px;
//           height: 18px;
//           border-radius: 50%;
//           background: #fff;
//           border: 2.5px solid var(--color-secondary, #6fba44);
//           box-shadow: 0 1px 6px rgba(0,0,0,0.18);
//           cursor: grab;
//           pointer-events: all;
//         }
//         .price-thumb:last-of-type { z-index: 1; }
//       `}</style>
//     </div>
//   );
// };

// /* ─── Accordion Section ──────────────────────────────────── */
// interface AccordionSectionProps {
//   title: string;
//   children: React.ReactNode;
//   isLast?: boolean;
// }

// const AccordionSection = ({
//   title,
//   children,
//   isLast = false,
// }: AccordionSectionProps) => {
//   const [open, setOpen] = useState(true);

//   return (
//     <div className={isLast ? "" : "border-b border-border/70"}>
//       <button
//         onClick={() => setOpen((o) => !o)}
//         className="w-full flex justify-between items-center px-4 py-3.5 hover:bg-border/20 transition-colors"
//       >
//         <span className="text-[11px] font-black uppercase tracking-[2px] text-foreground/80">
//           {title}
//         </span>
//         <ChevronRight
//           size={15}
//           className={`text-secondary transition-transform duration-300 ${open ? "rotate-90" : ""}`}
//         />
//       </button>

//       <div
//         className="overflow-hidden transition-all duration-300"
//         style={{ maxHeight: open ? "400px" : "0px", opacity: open ? 1 : 0 }}
//       >
//         <div className="px-4 pb-4">{children}</div>
//       </div>
//     </div>
//   );
// };

// /* ─── Main Page ──────────────────────────────────────────── */
// const CategoryPage = () => {
//   const { id } = useParams<{ id: string }>();
//   const [searchQuery, setSearchQuery] = useState("");
//   const { allCategories, categoryLoading } = useSelector(
//     (state: RootState) => state.adminCategories,
//   );

//   const { allProducts, loading } = useSelector(
//     (state: RootState) => state.adminProducts,
//   );

//   const { user } = useSelector((state: RootState) => state.auth);
//   const currentCategory = useMemo(() => {
//     if (!id) return null;
//     return allCategories.find((c: any) => c._id === id);
//   }, [id]);

//   const filteredProducts = useMemo(() => {
//     let result = products;

//     if (id) {
//       const categoryName = currentCategory?.name || "";
//       result = result.filter(
//         (p) => p.category.toLowerCase() === categoryName.toLowerCase(),
//       );
//     }

//     if (searchQuery) {
//       result = result.filter((p) =>
//         p.title.toLowerCase().includes(searchQuery.toLowerCase()),
//       );
//     }

//     return result;
//   }, [id, searchQuery, currentCategory]);

//   return (
//     <>
//       {/* commentsS Plugin */}
//       {user?.role == "admin" && <AnnotatorPlugin />}
//       {/* get all page from the database */}
//       <GetAllPages />
//       <div className="mx-auto px-[5%] pb-20 pt-[50px]">
//         {/* Breadcrumbs */}
//         <div className="crumbs flex items-center gap-2">
//           <Link href="/">Home</Link>{" "}
//           <ChevronRight size={12} className="opacity-50" />
//           <Link href="/shop">Shop</Link>{" "}
//           <ChevronRight size={12} className="opacity-50" />
//           <strong className="text-foreground">
//             {currentCategory ? currentCategory.name : "All Products"}
//           </strong>
//         </div>

//         {/* Header */}
//         <section className="pagehead">
//           <div className="pagehead-inner">
//             <div className="pagehead-content">
//               <small className="text-secondary tracking-[3px] uppercase text-[10px] font-black mb-2 block">
//                 {currentCategory ? "Category" : "Collection"}
//               </small>
//               <h1 className="text-[46px] font-black leading-[1.05] tracking-tight">
//                 {currentCategory ? currentCategory.name : "The Full Collection"}
//               </h1>
//               <p className="text-muted font-bold mt-2.5 max-w-[70ch] leading-relaxed">
//                 {currentCategory
//                   ? currentCategory.description
//                   : "Explore our entire range of design-led furniture and home essentials. Crafted with purpose, built for life."}
//               </p>

//               <div className="flex flex-wrap gap-2.5 mt-4">
//                 {["Seating", "Tables", "Lighting", "Decor", "Storage"].map(
//                   (sub) => (
//                     <button
//                       key={sub}
//                       className="h-10 px-4 rounded-full border border-border bg-white/65 dark:bg-surface/62 backdrop-blur-md text-[10px] font-black uppercase tracking-[2px] hover:border-secondary hover:bg-secondary/10 transition-all"
//                     >
//                       {sub}
//                     </button>
//                   ),
//                 )}
//               </div>
//             </div>

//             <div className="flex gap-2.5 flex-wrap justify-start lg:justify-end ml-auto">
//               <div className="pill">
//                 <b>120+</b> items
//               </div>
//               <div className="pill">
//                 <b>Fast</b> shipping
//               </div>
//               <div className="pill">
//                 <b>Top</b> rated
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Content Layout */}
//         <section className="mt-8">
//           <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
//             {/* LEFT FILTERS */}
//             <aside className="lg:sticky lg:top-[128px] space-y-6">
//               <div className="border border-border bg-surface rounded-[20px] overflow-hidden shadow-sm">
//                 {/* Filter header */}
//                 <div className="p-4 border-b border-border flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <Filter size={18} className="text-secondary" />
//                     <h3 className="text-[26px] font-black leading-none">
//                       Filters
//                     </h3>
//                   </div>
//                   <span className="text-[10px] font-black uppercase tracking-[2px] text-muted border border-border rounded-full px-2.5 py-1.5 bg-background">
//                     {currentCategory && currentCategory.title
//                       ? currentCategory.title
//                       : "All"}
//                   </span>
//                 </div>

//                 {/* Price slider */}
//                 <PriceRangeFilter />

//                 {/* Category accordion */}
//                 <AccordionSection title="Category">
//                   <div className="space-y-2.5">
//                     <Link
//                       href="/shop"
//                       className={`flex justify-between items-center text-sm font-bold hover:text-secondary transition-colors ${
//                         !id ? "text-secondary" : "text-muted"
//                       }`}
//                     >
//                       All Products{" "}
//                       {/* <small className="text-[10px] font-black opacity-50">
//                         120
//                       </small> */}
//                     </Link>
//                     {allCategories
//                       .filter((cat: any) => cat.parentId == null)
//                       .map((cat: any) => (
//                         <Link
//                           key={cat._id}
//                           href={`/category/${cat._id}`}
//                           className={`flex justify-between items-center text-sm font-bold hover:text-secondary transition-colors ${
//                             id === cat._id ? "text-secondary" : "text-muted"
//                           }`}
//                         >
//                           {cat.title ? cat.title : cat.name}
//                           {/* <small className="text-[10px] font-black opacity-50">
//                             {Math.floor(Math.random() * 30) + 10}
//                           </small> */}
//                         </Link>
//                       ))}
//                   </div>
//                 </AccordionSection>

//                 {/* Material accordion */}
//                 <AccordionSection title="Material">
//                   <div className="space-y-2.5">
//                     {["Solid Oak", "Velvet", "Linen", "Ceramic"].map((mat) => (
//                       <label
//                         key={mat}
//                         className="flex items-center gap-2.5 text-sm font-bold text-foreground/80 cursor-pointer group"
//                       >
//                         <input
//                           type="checkbox"
//                           className="w-4 h-4 accent-secondary"
//                         />
//                         {mat}
//                         <small className="ml-auto text-[10px] font-black text-muted opacity-50">
//                           12
//                         </small>
//                       </label>
//                     ))}
//                   </div>
//                 </AccordionSection>

//                 {/* Rating accordion */}
//                 <AccordionSection title="Rating" isLast>
//                   <div className="space-y-2.5">
//                     {[4.8, 4.5, 4.0].map((rate) => (
//                       <label
//                         key={rate}
//                         className="flex items-center gap-2.5 text-sm font-bold text-foreground/80 cursor-pointer group"
//                       >
//                         <input
//                           type="checkbox"
//                           className="w-4 h-4 accent-secondary"
//                         />
//                         <span className="flex items-center gap-1">
//                           <Star
//                             size={11}
//                             className="text-secondary fill-secondary"
//                           />
//                           {rate}+
//                         </span>
//                         <small className="ml-auto text-[10px] font-black text-muted opacity-50">
//                           26
//                         </small>
//                       </label>
//                     ))}
//                   </div>
//                 </AccordionSection>
//               </div>
//             </aside>

//             {/* RIGHT GRID */}
//             <div>
//               {/* Search and Sort Bar */}
//               <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
//                 <div className="relative w-full sm:max-w-md">
//                   <Search
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
//                     size={18}
//                   />
//                   <input
//                     type="text"
//                     placeholder="Search in this category..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full h-12 pl-12 pr-6 rounded-2xl border border-border bg-surface font-bold focus:border-secondary outline-none transition-all text-sm"
//                   />
//                 </div>
//                 <div className="flex items-center gap-3 w-full sm:w-auto">
//                   <span className="text-[11px] font-black uppercase tracking-[1px] text-muted whitespace-nowrap">
//                     Sort by:
//                   </span>
//                   <select className="h-12 px-4 rounded-2xl border border-border bg-surface font-bold text-sm outline-none focus:border-secondary cursor-pointer w-full sm:w-48">
//                     <option>Newest First</option>
//                     <option>Price: Low to High</option>
//                     <option>Price: High to Low</option>
//                     <option>Most Popular</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
//                 {filteredProducts.map((product) => (
//                   <div key={product.id} className="product-card group">
//                     <div className="badge">{product.badge}</div>
//                     <Link
//                       href={`/product/${product.id}`}
//                       className="img-wrap block"
//                     >
//                       <img src={product.img} alt={product.title} />
//                     </Link>
//                     <div className="card-body">
//                       <div className="flex justify-between items-start mb-2.5">
//                         <Link
//                           href={`/product/${product.id}`}
//                           className="font-heading text-[20px] font-black leading-[1.05] text-foreground/92 hover:text-secondary transition-colors"
//                         >
//                           {product.title}
//                         </Link>
//                         <div className="flex items-center gap-2">
//                           <button
//                             className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:text-secondary shrink-0"
//                             title="Wishlist"
//                           >
//                             <Heart size={18} />
//                           </button>

//                           <button
//                             className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:text-secondary shrink-0"
//                             title="Quick View"
//                           >
//                             <Eye size={18} />
//                           </button>

//                           {/* <button
//     onClick={() => dispatch(addToCart(product))}
//     className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 shrink-0"
//     title="Add to Cart"
//   >
//     <Plus size={20} />
//   </button> */}
//                         </div>
//                       </div>
//                       <div className="flex justify-between items-center gap-2.5 flex-wrap font-black tracking-[1px] text-foreground/75">
//                         <span className="text-black text-[13px] uppercase tracking-[2px]">
//                           {product.price}
//                         </span>
//                         <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-primary whitespace-nowrap">
//                           <Star
//                             size={12}
//                             className="text-secondary fill-secondary"
//                           />{" "}
//                           {product.rating.toFixed(1)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {filteredProducts.length === 0 && (
//                 <div className="py-20 text-center">
//                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/10 mb-6">
//                     <Search size={32} className="text-muted" />
//                   </div>
//                   <h3 className="text-2xl font-bold mb-2">No products found</h3>
//                   <p className="text-muted font-semibold mb-8">
//                     We couldn&apos;t find any products matching your search.
//                   </p>
//                   <button
//                     onClick={() => setSearchQuery("")}
//                     className="text-secondary font-black text-xs uppercase tracking-[2px] border-b border-secondary pb-1"
//                   >
//                     Clear Search
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </section>
//       </div>
//     </>
//   );
// };

// export default CategoryPage;

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Star,
  Search,
  Filter,
  Heart,
  Eye,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { RootState } from "@/lib/store/store";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentPages } from "@/lib/store/pages/pagesSlice";
import { AnnotatorPlugin } from "../annotationPlugin/AnnotatorPlugin";
import GetAllPages from "./GetAllPages";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import PriceRangeFilter from "../category/PriceRangeFilter";
import AccordionSection from "../category/accordionSection/AccordionSection";
import Pagination from "../category/Pagination";
import PageHead from "../category/pageHead/PageHead";
import { CategoryRecord } from "@/lib/store/categories/categoriesSlices";
import { defaultSidebarFilters } from "../category/accordionSection/accordionData";

/* ─── Loading Skeleton ──────────────────────────────────── */
const ProductCardSkeleton = () => (
  <div className="product-card animate-pulse">
    <div className="img-wrap bg-muted/20 aspect-square rounded-2xl mb-4"></div>
    <div className="card-body space-y-3">
      <div className="h-5 bg-muted/20 rounded w-3/4"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted/20 rounded w-20"></div>
        <div className="h-4 bg-muted/20 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="mx-auto px-[5%] pb-20 pt-[50px]">
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto" />
        <p className="text-muted font-bold text-sm">Loading products...</p>
      </div>
    </div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────── */
const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    Number(searchParams.get("perPage")) || 9,
  );

  const { allCategories, categoryLoading } = useSelector(
    (state: RootState) => state.adminCategories,
  );



  const { allProducts, loading } = useSelector(
    (state: RootState) => state.adminProducts,
  );

  const { user } = useSelector((state: RootState) => state.auth);

  const currentCategory = useMemo(() => {
    if (!id) return null;
    return allCategories.find((c: any) => c._id === id);
  }, [id, allCategories]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // if (currentCategory != undefined && currentCategory._id) {
    //   result = result.filter((p) =>
    //     p.categoryIds.includes(currentCategory?.id??""),
    //   );
    // }

    return result;
  }, [currentCategory, allProducts]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Update URL when pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", items.toString());
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (categoryLoading || loading) {
    return <LoadingState />;
  }

  return (
    <>
      {/* Comments Plugin */}
      {user?.role === "admin" && <AnnotatorPlugin />}
      {/* get all page from the database */}
      <GetAllPages />
      <div className="mx-auto px-[5%] pb-20 pt-[50px]">
        {/* Breadcrumbs */}
        <div className="crumbs flex items-center gap-2">
          <Link href="/">Home</Link>{" "}
          <ChevronRight size={12} className="opacity-50" />
          <Link href="/shop">Shop</Link>{" "}
          <ChevronRight size={12} className="opacity-50" />
          <strong className="text-foreground">
            {currentCategory ? (currentCategory.title || currentCategory.name) : "All Products"}
          </strong>
        </div>

        {/* Header */}
        <PageHead
          currentCategory={currentCategory as CategoryRecord}
          productCount={filteredProducts.length}
        />

        {/* Content Layout */}
        <section className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
            {/* LEFT FILTERS */}
            <aside className="lg:sticky lg:top-[128px] space-y-6">
              <div className="border border-border bg-surface rounded-[20px] overflow-hidden shadow-sm">
                {/* Filter header */}
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-secondary" />
                    <h3 className="text-[26px] font-black leading-none">
                      Filters
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-muted border border-border rounded-full px-2.5 py-1.5 bg-background">
                    {currentCategory && currentCategory.title
                      ? currentCategory.title
                      : "All"}
                  </span>
                </div>

                {/* Price slider */}
                <PriceRangeFilter />
{/* 
                {cmsFilters && cmsFilters?.map((filter: any) => {
                  const filterType = filter.props?.filterType;
                  return (
                    <AccordionSection 
                      key={filter.adminTitle} 
                      adminTitle={filter.adminTitle}
                      title={filter.props.title?.[lang] || filter.props.title?.en}
                      isLast={filter.props.isLast}
                    >
                      {filterType === "category-list" && (
                        <div className="space-y-2.5">
                          <Link
                            href="/category/all"
                            className={`flex justify-between items-center text-sm font-bold hover:text-secondary transition-colors ${
                              !id ? "text-secondary" : "text-muted"
                            }`}
                          >
                            All Products
                          </Link>
                          {allCategories
                            .filter((cat: any) => cat.parentId == null)
                            .map((cat: any) => (
                              <Link
                                key={cat._id}
                                href={`/category/${cat._id}`}
                                className={`flex justify-between items-center text-sm font-bold hover:text-secondary transition-colors ${
                                  id === cat._id ? "text-secondary" : "text-muted"
                                }`}
                              >
                                {cat.title ? cat.title : cat.name}
                              </Link>
                            ))}
                        </div>
                      )}

                      {filterType === "checkbox-list" && (
                        <div className="space-y-2.5">
                          {(filter.content || []).map((item: any) => {
                            const p = item.props || item;
                            const itemTitle = p.title?.[lang] || p.title?.en || p.title;
                            return (
                              <label
                                key={p.value}
                                className="flex items-center gap-2.5 text-sm font-bold text-foreground/80 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-secondary"
                                />
                                {itemTitle}
                                <small className="ml-auto text-[10px] font-black text-muted opacity-50">
                                  {p.count}
                                </small>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {filterType === "rating-list" && (
                        <div className="space-y-2.5">
                          {(filter.content || []).map((item: any) => {
                            const p = item.props || item;
                            return (
                              <label
                                key={p.value}
                                className="flex items-center gap-2.5 text-sm font-bold text-foreground/80 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-secondary"
                                />
                                <span className="flex items-center gap-1">
                                  <Star
                                    size={11}
                                    className="text-secondary fill-secondary"
                                  />
                                  {p.value}+
                                </span>
                                <small className="ml-auto text-[10px] font-black text-muted opacity-50">
                                  {p.count}
                                </small>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </AccordionSection>
                  );
                })} */}
              </div>
            </aside>

            {/* RIGHT GRID */}
            <div>
              {/* Search and Sort Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                <div className="relative w-full sm:max-w-md">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search in this category..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full h-12 pl-12 pr-6 rounded-2xl border border-border bg-surface font-bold focus:border-secondary outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-[11px] font-black uppercase tracking-[1px] text-muted whitespace-nowrap">
                    Sort by:
                  </span>
                  <select className="h-12 px-4 rounded-2xl border border-border bg-surface font-bold text-sm outline-none focus:border-secondary cursor-pointer w-full sm:w-48">
                    <option>Newest First</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: itemsPerPage }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedProducts?.map((product) => (
                      <div key={product._id} className="product-card group">
                        {/* <div className="badge">{product.badge}</div> */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="img-wrap block"
                        >
                          <img
                            src={product?.gallery?.[0]?.url || ''}
                            alt={product?.gallery?.[0]?.alt || ''}
                          />
                        </Link>
                        <div className="card-body">
                          <div className="flex justify-between items-start mb-2.5">
                            <Link
                              href={`/product/${product.slug}`}
                              className="font-heading text-[20px] font-black leading-[1.05] text-foreground/92 hover:text-secondary transition-colors"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2">
                              <button
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:text-secondary shrink-0"
                                title="Wishlist"
                              >
                                <Heart size={18} />
                              </button>

                              <button
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:text-secondary shrink-0"
                                title="Quick View"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center gap-2.5 flex-wrap font-black tracking-[1px] text-foreground/75">
                            <span className="text-black text-[13px] uppercase tracking-[2px]">
                              {product.price}
                            </span>
                            {/* <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-primary whitespace-nowrap">
                              <Star
                                size={12}
                                className="text-secondary fill-secondary"
                              />{" "}
                              {product.rating.toFixed(1)}
                            </span> */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {filteredProducts.length > 0 && totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  )}
                </>
              )}

              {/* Empty State */}
              {filteredProducts.length === 0 && !loading && (
                <div className="py-20 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/10 mb-6">
                    <Search size={32} className="text-muted" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No products found</h3>
                  <p className="text-muted font-semibold mb-8">
                    We couldn&apos;t find any products matching your search.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-secondary font-black text-xs uppercase tracking-[2px] border-b border-secondary pb-1"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CategoryPage;
