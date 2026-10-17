"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import  SocialProviders  from "@/components/SocialProviders";

export type AuthMode = "sign-in" | "sign-up";

export interface AuthFormProps {
  mode: AuthMode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthForm({
  mode,
  title,
  subtitle,
  className = "",
}: AuthFormProps) {
  const isSignUp = mode === "sign-up";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resolvedTitle =
    title ?? (isSignUp ? "Join Brillivo Today!" : "Welcome Back to Brillivo");
  const resolvedSubtitle =
    subtitle ??
    (isSignUp
      ? "Create your account to start your fine jewelry collection"
      : "Sign in to access your saved pieces and private orders");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (isSignUp && !fullName.trim()) {
      setErrorMessage("Please enter your full name to continue.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setStatusMessage(
      isSignUp
        ? "UI preview: Your Brillivo collector profile is ready."
        : "UI preview: Signed in to your Brillivo collector account."
    );
  };

  const handleSocialPlaceholder = (provider: "google" | "apple") => {
    setErrorMessage(null);
    const label = provider === "google" ? "Google" : "Apple";
    setStatusMessage(`UI preview: ${label} authentication triggered.`);
  };

  return (
    <div className={`w-full max-w-md mx-auto font-jost text-[var(--dark)] ${className}`}>
      {/* Top Switch Prompt (Matches reference layout top line) */}
      <p className="text-center text-caption text-[var(--dark)]/70">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-[var(--dark)] underline underline-offset-4 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-[var(--dark)] underline underline-offset-4 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
            >
              Sign Up
            </Link>
          </>
        )}
      </p>

      {/* Heading & Subtitle */}
      <div className="mt-7 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--dark)]">
          {resolvedTitle}
        </h1>
        <p className="mt-2 text-body text-[var(--dark)]/65">
          {resolvedSubtitle}
        </p>
      </div>

      {/* Social Sign-In Providers (Google & Apple) */}
      <div className="mt-8">
        <SocialProviders/>
      </div>

      {/* Accessible Error / Status Placeholders */}
      <div aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <div
            id="auth-form-error"
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--dark)] bg-[var(--dark)]/5 px-4 py-3 text-caption text-[var(--dark)]"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--agua)]"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--agua)] bg-[var(--agua)]/10 px-4 py-3 text-caption text-[var(--dark)]"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--agua)]"
            />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Email / Password Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={errorMessage ? "auth-form-error" : undefined}
        className="space-y-5"
      >
        {isSignUp && (
          <div>
            <label
              htmlFor="full-name"
              className="mb-2 block text-caption font-medium text-[var(--dark)]"
            >
              Full Name
            </label>
            <input
              id="full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-[var(--gray)] bg-[var(--light)] px-4 py-3.5 text-body text-[var(--dark)] placeholder:text-[var(--dark)]/40 transition-colors focus:border-[var(--agua)] focus:outline-none focus:ring-2 focus:ring-[var(--agua)]/30"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-caption font-medium text-[var(--dark)]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="johndoe@gmail.com"
            className="w-full rounded-xl border border-[var(--gray)] bg-[var(--light)] px-4 py-3.5 text-body text-[var(--dark)] placeholder:text-[var(--dark)]/40 transition-colors focus:border-[var(--agua)] focus:outline-none focus:ring-2 focus:ring-[var(--agua)]/30"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-caption font-medium text-[var(--dark)]"
            >
              Password
            </label>
            {!isSignUp && (
              <Link
                href="#forgot-password"
                className="text-footnote text-[var(--dark)]/65 underline underline-offset-4 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-sm"
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
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimum 8 characters"
              className="w-full rounded-xl border border-[var(--gray)] bg-[var(--light)] py-3.5 pr-12 pl-4 text-body text-[var(--dark)] placeholder:text-[var(--dark)]/40 transition-colors focus:border-[var(--agua)] focus:outline-none focus:ring-2 focus:ring-[var(--agua)]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 flex items-center justify-center px-2 text-[var(--dark)]/60 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] rounded-md cursor-pointer"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Eye aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-full bg-[var(--dark)] px-6 py-4 text-body-medium font-medium text-[var(--light)] transition-colors duration-200 hover:bg-[var(--agua)] hover:text-[var(--dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)] focus-visible:ring-offset-2 cursor-pointer"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {/* Legal Terms & Privacy Notice */}
      <p className="mt-6 text-center text-footnote text-[var(--dark)]/60">
        By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
        <Link
          href="#terms-of-service"
          className="underline underline-offset-2 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="#privacy-policy"
          className="underline underline-offset-2 transition-colors hover:text-[var(--agua)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--agua)]"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

export default AuthForm;
