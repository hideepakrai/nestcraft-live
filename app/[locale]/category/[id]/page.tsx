import { Suspense } from "react";
import Component from "@/components/pages/CategoryPage";
import GetProductCategoryWise from "@/lib/GetAllDetails/GetProductCategoryWise";
import PageLoader from "@/components/pages/PageLoader";

export default function CatPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading Category" />}>
      <GetProductCategoryWise />
      <Component />
    </Suspense>
  );
}
