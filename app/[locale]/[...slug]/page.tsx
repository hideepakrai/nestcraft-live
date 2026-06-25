// app/[...slug]/page.tsx
import { notFound } from "next/navigation";
import CatPage from "../category/[id]/page";
import { resolvePermalink } from "@/lib/permalink";
import ProdPage from "../product/[id]/page";
import { getBusinessBlueprint } from "@/lib/getPageData";

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathname = "/" + slug.join("/");
  const businessBluePrint = await getBusinessBlueprint();
  const permalinks = businessBluePrint?.payload?.permalinkDetails;

  const resolved = resolvePermalink(pathname, permalinks);

  if (!resolved) notFound();

  switch (resolved.type) {
    case "permalinkStructure":
      if (resolved.slug.length !== 0) {
        return (
          <ProdPage
            params={Promise.resolve({
              id: resolved.slug[0],
            })}
          />
        );
      } else {
        notFound();
      }
    case "productCategoryBase":
      return <CatPage />;
    default:
      notFound();
  }
}
