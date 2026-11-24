import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(254, "Email must be 254 characters or fewer.")
  .email("Enter a valid email address.");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const nameField = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(100, "Name must be 100 characters or fewer.");

export const internalPathSchema = z
  .string()
  .trim()
  .min(1, "Redirect target is required.")
  .max(512, "Redirect target is too long.")
  .refine(
    (value) => value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\"),
    { message: "Redirect target must be an internal path." }
  );

export const redirectField = internalPathSchema.optional();

export const signUpSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  redirectTo: redirectField,
});

export const signInSchema = z.object({
  email: emailField,
  password: passwordField,
  redirectTo: redirectField,
});

export const guestSessionSchema = z.object({
  sessionToken: z.string().uuid(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export type AuthActionResult =
  | { ok: true; userId: string; redirectTo: string }
  | { ok: false; error: string };

export type GuestSessionResult = { sessionToken: string | null };

export type CreateGuestSessionResult = {
  ok: boolean;
  sessionToken: string | null;
};

export function sanitizeRedirect(value: unknown, fallback = "/"): string {
  const parsed = internalPathSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export function firstIssueMessage(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}
