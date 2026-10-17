import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
	variable: "--font-jost",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "BRILLIVO | Signature Collection — Fine Topaz & Pavé Jewelry",
	description:
		"Explore the Brillivo Signature Collection. Architectural sterling silver, 18K white gold vermeil, and natural Sky & London Blue Topaz jewelry powered by Next.js, Drizzle ORM, Neon PostgreSQL, Better Auth, and Zustand.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className={`${jost.className} antialiased`}>{children}</body>
		</html>
	);
}
