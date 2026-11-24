"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import SocialProviders from "./SocialProviders";
import type { AuthActionResult } from "@/lib/auth/validation";

export interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  onSubmit: (formData: FormData) => Promise<AuthActionResult | void>;
  redirectTo?: string;
  className?: string;
}

const FIELD =
  "w-full rounded-xl border border-silver-300 bg-light-100 px-4 py-3 text-body text-dark-900 transition-colors placeholder:text-silver-600 focus:border-silver-500 focus:outline-none focus:ring-2 focus:ring-[--color-silver-300] disabled:cursor-not-allowed disabled:opacity-60";

const LABEL = "text-footnote uppercase tracking-[0.18em] text-silver-600";

const SUBMIT_BUTTON =
  "mt-2 inline-flex w-full items-center justify-center gap-3 rounded-full bg-dark-900 px-6 py-3.5 text-caption uppercase tracking-[0.22em] text-light-100 transition-colors hover:bg-silver-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

const COPY = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Sign in to Brillivo",
    subtitle: "Access your orders, wishlist and private collections.",
    submit: "Sign in",
    prompt: "New to Brillivo?",
    promptLink: "Create an account",
    promptHref: "/sign-up",
  },
  "sign-up": {
    eyebrow: "Create account",
    title: "Join Brillivo",
    subtitle: "Save your favourite pieces and be first to new silver collections.",
    submit: "Create account",
    prompt: "Already have an account?",
    promptLink: "Sign in",
    promptHref: "/sign-in",
  },
} as const;

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-light-100/40 border-t-light-100"
    />
  );
}

export default function AuthForm({
  mode,
  onSubmit,
  redirectTo,
  className = "",
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const copy = COPY[mode];
  const isSignUp = mode === "sign-up";
  const promptHref = redirectTo
    ? `${copy.promptHref}?redirect=${encodeURIComponent(redirectTo)}`
    : copy.promptHref;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onSubmit(formData);

      if (result && !result.ok) {
        setError(result.error);
        return;
      }

      form.reset();
      router.push(result?.redirectTo ?? redirectTo ?? "/");
      router.refresh();
    } catch (submitError) {
      console.error("Authentication failed", submitError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <header className="text-center">
        <p className="text-footnote uppercase tracking-[0.3em] text-silver-600">{copy.eyebrow}</p>
        <h1 className="mt-3 text-heading-3 text-dark-900">{copy.title}</h1>
        <p className="mt-2 text-body text-dark-700">{copy.subtitle}</p>
      </header>

      <SocialProviders variant={mode} />

      <div className="flex items-center gap-4">
        <hr className="h-px w-full border-0 bg-silver-200" />
        <span className="shrink-0 text-footnote uppercase tracking-[0.18em] text-silver-600">
          Or with email
        </span>
        <hr className="h-px w-full border-0 bg-silver-200" />
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-(--color-red)/30 bg-(--color-red)/5 px-4 py-3 text-caption text-[--color-red]"
          >
            {error}
          </p>
        )}

        {isSignUp && (
          <div className="space-y-2">
            <label htmlFor="name" className={LABEL}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              required
              className={FIELD}
            />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={FIELD}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="password" className={LABEL}>
              Password
            </label>
            {!isSignUp && (
              <Link
                href="/forgot-password"
                className="text-footnote text-silver-600 underline-offset-4 transition-colors hover:text-dark-900 hover:underline focus:outline-none focus-visible:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={isSignUp ? "Minimum 8 characters" : "Your password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              required
              className={`${FIELD} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 inline-flex items-center px-3 text-footnote uppercase tracking-[0.14em] text-silver-600 transition-colors hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-1"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={SUBMIT_BUTTON}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Please wait" : copy.submit}
        </button>

        {isSignUp && (
          <p className="text-center text-footnote text-dark-700">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-dark-900">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-dark-900">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      <p className="border-t border-silver-200 pt-6 text-center text-caption text-dark-700">
        {copy.prompt}{" "}
        <Link
          href={promptHref}
          className="text-dark-900 underline underline-offset-4 transition-colors hover:text-silver-700 focus:outline-none focus-visible:underline"
        >
          {copy.promptLink}
        </Link>
      </p>
    </div>
  );
}
