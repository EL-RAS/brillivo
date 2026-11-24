"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { addReview } from "@/lib/actions/review";

interface AddReviewFormProps {
  productId: string;
  isAuthenticated: boolean;
}

export default function AddReviewForm({ productId, isAuthenticated }: AddReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const displayRating = hoveredRating || rating;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("Please sign in to write a review.");
      return;
    }

    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("rating", rating.toString());
    formData.set("comment", comment);

    try {
      const result = await addReview(formData);

      if (!result.ok) {
        setError(result.error ?? "Unable to submit your review. Please try again.");
        return;
      }

      setSuccess(true);
      setRating(0);
      setComment("");
    } catch (submitError) {
      console.error("Review submission failed.", submitError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    const redirect = typeof window === "undefined" ? `/products/${productId}` : window.location.pathname + window.location.search;
    return (
      <div className="mt-8 rounded-2xl border border-light-300 bg-light-200/60 px-5 py-6 text-center">
        <p className="text-body-medium text-dark-900">Share your experience</p>
        <p className="mt-1 text-caption text-dark-700">
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(redirect)}`}
            className="underline underline-offset-4 transition-colors hover:text-dark-900"
          >
            Sign in to rate and review this piece
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-green/40 bg-green/5 px-5 py-6 text-center">
        <p className="text-body-medium text-dark-900">Thank you for your review</p>
        <p className="mt-1 text-caption text-dark-700">
          Your review has been submitted and will appear shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <div>
        <p className="text-footnote uppercase tracking-[0.18em] text-silver-600">Your rating</p>
        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= displayRating;

            return (
              <button
                key={starValue}
                type="button"
                onClick={() => {
                  setRating(starValue);
                  setError(null);
                }}
                onMouseEnter={() => setHoveredRating(starValue)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-1"
                aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-6 w-6 ${
                    isFilled ? "fill-[--color-silver-600] text-[--color-silver-600]" : "text-silver-400"
                  }`}
                  fill={isFilled ? "currentColor" : "none"}
                  stroke="currentColor"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-comment" className="text-footnote uppercase tracking-[0.18em] text-silver-600">
          Your review (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Tell us about the quality, fit, or finish..."
          className="w-full rounded-2xl border border-silver-300 bg-light-100 px-4 py-3 text-body text-dark-900 placeholder:text-silver-600 transition-colors focus:border-silver-500 focus:outline-none focus:ring-2 focus:ring-[--color-silver-300]"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[--color-red]/30 bg-[--color-red]/5 px-4 py-3 text-caption text-[--color-red]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating < 1}
        className="inline-flex items-center justify-center gap-3 self-start rounded-full bg-dark-900 px-8 py-3 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-light-100/40 border-t-light-100"
          />
        )}
        {isSubmitting ? "Submitting" : "Submit review"}
      </button>
    </form>
  );
}
