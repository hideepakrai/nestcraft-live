import { Metadata } from "next";
import { getPageData } from "@/lib/getPageData";
import { Suspense } from 'react';
import Component from '@/components/pages/CategoryPage';
import GetAllPages from '@/components/pages/GetAllPages';
import GetAllMenus from '@/components/cms/menus/GetAllMenus';
import GetProductCategoryWise from '@/lib/GetAllDetails/GetProductCategoryWise';
import PageLoader from '@/components/pages/PageLoader';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPageData("ecommerce");
  return {
    title: data?.metaTitle?.[locale] || data?.metaTitle?.en || "Shop Furniture | NestCraft Living",
    description: data?.metaDescription?.[locale] || data?.metaDescription?.en || "Browse our curated collection of premium handcrafted furniture for every room.",
    openGraph: {
      title: data?.metaTitle?.[locale] || "Shop Furniture | NestCraft Living",
      description: data?.metaDescription?.[locale] || "Browse our curated collection of premium handcrafted furniture.",
    },
    robots: { index: true, follow: true },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoader text="Loading Shop" />}>
      <GetAllPages />
      <GetAllMenus />
      <GetProductCategoryWise />
      <Component />
    </Suspense>
  );
}
