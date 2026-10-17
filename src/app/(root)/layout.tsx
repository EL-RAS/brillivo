import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MainRootGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--light)] text-[var(--dark)] font-jost">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
