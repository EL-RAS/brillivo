"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { z } from "zod";

const addReviewSchema = z.object({
  productId: z.string().uuid("Invalid product."),
  rating: z.coerce.number().int().min(1, "Please select a rating.").max(5),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be 2000 characters or less.")
    .optional()
    .or(z.literal("")),
});

export type AddReviewResult = {
  ok: boolean;
  error?: string;
};

export async function addReview(formData: FormData): Promise<AddReviewResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "Please sign in to write a review." };
  }

  const parsed = addReviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid review details.";
    return { ok: false, error: message };
  }

  const { productId, rating, comment } = parsed.data;
  const trimmedComment = comment && comment.length > 0 ? comment : null;

  try {
    await db.insert(reviews).values({
      productId,
      userId: user.id,
      rating,
      comment: trimmedComment,
    });

    revalidatePath(`/products/${productId}`);
    revalidatePath("/products");

    return { ok: true };
  } catch (error: unknown) {
    const dbError = error as { code?: string };

    if (dbError?.code === "23505") {
      return { ok: false, error: "You have already reviewed this product." };
    }

    console.error("Failed to submit review.", error);
    return { ok: false, error: "Unable to submit your review. Please try again." };
  }
}
