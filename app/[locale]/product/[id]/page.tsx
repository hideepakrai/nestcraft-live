import Component from "@/components/pages/ProductDetailPage";
import { getSingleProduct } from "@/lib/getPageData";

export default async function ProdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("id poprdicurr", id);
  const product = await getSingleProduct(id);

  if (!product) {
    return <div>Product not found</div>;
  }
  return (
    <>
      <Component currentProduct={product} />
    </>
  );
}
