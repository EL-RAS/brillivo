import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be under 100 characters.")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters."),
  callbackUrl: z
    .string()
    .trim()
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "Invalid redirect path.")
    .optional(),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(255),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must not exceed 128 characters."),
  callbackUrl: z
    .string()
    .trim()
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "Invalid redirect path.")
    .optional(),
});

export const mergeGuestSchema = z.object({
  userId: z.string().uuid("Invalid user identifier."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type MergeGuestInput = z.infer<typeof mergeGuestSchema>;
