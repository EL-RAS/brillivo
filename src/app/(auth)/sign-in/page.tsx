import type { Metadata } from "next";
import React, { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | BRILLIVO Fine Jewelry",
  description:
    "Sign in to your Brillivo collector account to manage your saved Sky & London Blue Topaz pieces and orders.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto h-96" />}>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
