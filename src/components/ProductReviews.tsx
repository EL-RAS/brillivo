import { getProductReviews } from "@/lib/actions/product";
import StarRating from "./StarRating";

/**
 * Server-rendered reviews block for the PDP.
 *
 * Loaded inside a `<Suspense>` boundary by the page so the review query never
 * blocks the main product render. Renders a rating summary plus each approved
 * review (stars, author, date and comment).
 */

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await getProductReviews(productId);

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-light-300 bg-light-200/60 px-5 py-8 text-center">
        <p className="text-body-medium text-dark-900">No reviews yet</p>
        <p className="mt-1 text-caption text-dark-700">
          Be the first to share your thoughts on this piece.
        </p>
      </div>
    );
  }

  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-light-300 bg-light-200/60 px-5 py-4">
        <span className="text-heading-2 text-dark-900">{average.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
          <StarRating value={average} />
          <span className="text-caption text-dark-700">
            Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-light-300">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <StarRating value={review.rating} />
                {review.title && (
                  <span className="text-body-medium text-dark-900">{review.title}</span>
                )}
              </div>
              <time className="text-footnote text-dark-700" dateTime={review.createdAt}>
                {formatDate(review.createdAt)}
              </time>
            </div>
            <p className="text-caption uppercase tracking-[0.2em] text-silver-600">
              {review.author}
            </p>
            <p className="text-body text-dark-700">{review.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
