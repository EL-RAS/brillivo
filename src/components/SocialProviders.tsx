"use client";

import React from "react";
import Image from "next/image";

export type SocialProviderId = "google" | "apple";

interface SocialProviderConfig {
  id: SocialProviderId;
  label: string;
  icon: string;
}

const PROVIDERS: readonly SocialProviderConfig[] = [
  { id: "google", label: "Google", icon: "/google.svg" },
  { id: "apple", label: "Apple", icon: "/apple.svg" },
];

export interface SocialProvidersProps {
  variant?: "sign-in" | "sign-up";
  className?: string;
}

function SocialProviders({
  variant = "sign-in",
  className = "",
}: SocialProvidersProps) {
  const action = variant === "sign-in" ? "Sign in" : "Sign up";

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          aria-label={`${action} with ${provider.label}`}
          className="inline-flex h-11 items-center justify-center gap-2.5 rounded-full border border-silver-300 bg-light-100 px-4 text-caption uppercase tracking-[0.14em] text-dark-900 transition-colors hover:border-silver-500 hover:bg-silver-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
        >
          <Image src={provider.icon} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}


export default SocialProviders;
