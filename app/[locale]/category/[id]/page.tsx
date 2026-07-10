import { Metadata } from "next";
import { Suspense } from "react";
import Component from "@/components/pages/CategoryPage";
import GetProductCategoryWise from "@/lib/GetAllDetails/GetProductCategoryWise";
import PageLoader from "@/components/pages/PageLoader";
import { getPageData } from "@/lib/getPageData";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPageData("ecommerce");
  return {
    title: data?.metaTitle?.[locale] || "Category | NestCraft Living",
    description: data?.metaDescription?.[locale] || "Browse furniture by category at NestCraft Living.",
    robots: { index: true, follow: true },
  };
}

export default function CatPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading Category" />}>
      <GetProductCategoryWise />
      <Component />
    </Suspense>
  );
}
