import { Card } from "@/components";
import { getRecommendedProducts } from "@/lib/actions/product";

/**
 * Server-rendered "You Might Also Like" rail for the PDP.
 *
 * Loaded inside a `<Suspense>` boundary so the recommendation query runs in
 * parallel with the main product render. Reuses the existing `Card` and links
 * each item to its own product detail page.
 */
export default async function RecommendedProducts({ productId }: { productId: string }) {
  const { products } = await getRecommendedProducts(productId);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading" className="mt-16">
      <h2 id="recommended-heading" className="text-heading-2 text-dark-900">
        You Might Also Like
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            title={product.name}
            imageSrc={product.imageUrl}
            imageAlt={product.name}
            price={product.price ?? undefined}
            href={`/products/${product.id}`}
            wishlistProductId={product.id}
          />
        ))}
      </div>
    </section>
  );
}
