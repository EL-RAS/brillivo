import type { Metadata } from "next";
import React, { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up | BRILLIVO Fine Jewelry",
  description:
    "Create your Brillivo collector account to explore architectural sterling silver and natural topaz jewelry.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto h-96" />}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
