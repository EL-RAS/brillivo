# BRILLIVO — Signature Collection Next.js App

A full-stack luxury jewelry storefront for **BRILLIVO** built with:

- **Framework**: Next.js 15 (App Router) + TypeScript + ESLint
- **Styling**: TailwindCSS v4
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm/neon-http`) + `drizzle-kit`
- **Authentication**: Better Auth (`better-auth` with `drizzleAdapter`)
- **State Management**: Zustand (`zustand` with `persist` middleware)

## Included Brillivo Signature Collection Products (from attached product imagery)

1. **The Hybrid Wave Bracelet (`BRV-SIG-001`)** — `/images/products/hybrid-wave-bracelet.jpg`
2. **Eternal Flame Open Cuff Bangle (`BRV-SIG-002`)** — `/images/products/eternal-flame-open-cuff-bangle.jpg`
3. **Vortex Princess-Cut Topaz Ring (`BRV-SIG-003`)** — `/images/products/vortex-princess-topaz-ring.jpg`
4. **Braided Bezel London Blue Signet Band (`BRV-SIG-004`)** — `/images/products/braided-bezel-london-blue-signet-band.jpg`
5. **Twisted Flame Teardrop Pendant Necklace (`BRV-SIG-005`)** — `/images/products/twisted-flame-teardrop-pendant.png`
6. **Inside-Out Pavé Huggie Hoops (`BRV-SIG-006`)** — `/images/products/inside-out-pave-huggie-hoops.jpg`
7. **Flame Crest Sculptural Lapel Pin & Enhancer (`BRV-SIG-007`)** — `/images/products/flame-crest-sculptural-pin.jpg`

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and set your Neon PostgreSQL `DATABASE_URL` and `BETTER_AUTH_SECRET`:
   ```bash
   cp .env.example .env
   ```

3. **Push Drizzle schema & seed the Brillivo products table:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
