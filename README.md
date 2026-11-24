<div align="center">
  <br />
  <img src="public/readme/Hero.jpg" alt="Brillivo Sterling Silver Jewelry Banner" width="100%">
  <br />

  <h2 align="center">Brillivo — Sterling Silver Jewelry E-Commerce</h2>
  <p align="center">
    Modern full-stack silver jewelry storefront built with Next.js, Drizzle ORM, Neon PostgreSQL, Better Auth, and Zustand.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <br />
    <img src="https://img.shields.io/badge/-Drizzle_ORM-black?style=for-the-badge&logoColor=C5F74F&logo=drizzle&color=black" alt="Drizzle ORM" />
    <img src="https://img.shields.io/badge/Neon_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black" alt="Neon PostgreSQL" />
    <img src="https://img.shields.io/badge/-Better_Auth-black?style=for-the-badge&logoColor=white&color=111111" alt="Better Auth" />
    <img src="https://img.shields.io/badge/-Zustand-black?style=for-the-badge&logoColor=white&color=222222" alt="Zustand" />
  </div>
</div>

<br />

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)

---

## ✨ Introduction

**Brillivo** is a full-stack e-commerce web application crafted for a modern sterling silver jewelry brand. It features a clean editorial storefront, database-driven product catalog and dynamic reviews, seamless guest-to-user cart and wishlist merging upon sign-in, and a Cash on Delivery (COD) checkout flow backed by PostgreSQL.

---

## 🔋 Features

* **Editorial Landing Page**: Custom visual campaign banners (`Hero.jpg` and `Ring_banner.jpg`), curated collections, and a **Trending Now** showcase.
* **Product Catalog & Product Details Page (PDP)**: Category navigation, search, variant/finish details, live average star ratings, review counts, and interactive review submission.
* **Guest & Authenticated Cart + Wishlist**: Persistent cart and wishlist state powered by Zustand and PostgreSQL, with automatic guest-to-account merging on login.
* **Cash on Delivery (COD) Checkout**: Shipping address form, live order summary synced with the shopping bag, transactional order creation, and order confirmation flow.
* **Authentication**: Email/password and OAuth sign-up/sign-in powered by Better Auth with navbar session controls.

---

## ⚙️ Tech Stack

* **[Next.js](https://nextjs.org/docs)** — App Router framework for server and client rendering, route handlers, and server actions.
* **[TypeScript](https://www.typescriptlang.org/)** — Static typing across database queries, server actions, stores, and UI components.
* **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling tailored to Brillivo's visual system.
* **[Drizzle ORM](https://orm.drizzle.team/)** — Type-safe SQL schema definitions and relational queries.
* **[Neon](https://neon.com/)** — Serverless PostgreSQL database hosting.
* **[Better Auth](https://www.better-auth.com/)** — Session management and user authentication.
* **[Zustand](https://zustand-demo.pmnd.rs)** — Lightweight client-side state management for cart, wishlist, and UI state.

---

## 🤸 Quick Start

Follow these steps to run **Brillivo** locally:

### Prerequisites

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/en)
* [npm](https://www.npmjs.com/)

### 1. Clone the Repository

```bash
git clone [https://github.com/EL-RAS/brillivo.git](https://github.com/EL-RAS/brillivo.git)
cd brillivo
2. Install Dependencies
npm install
3. Configure Environment Variables
Create a .env file in the project root:
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-strong-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Optional OAuth Providers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
4. Push Schema & Start Development Server
npx drizzle-kit push
npm run dev
Open http://localhost:3000 in your browser.
📁 Project Structure
src/
├── app/
│   ├── (root)/
│   │   ├── page.tsx               # Landing page
│   │   ├── products/              # Product listing & PDP routes
│   │   ├── cart/                  # Shopping bag page
│   │   ├── checkout/              # Cash on Delivery checkout & success pages
│   │   └── wishlist/              # Saved items page
│   ├── (auth)/                    # Sign-in & sign-up pages
│   └── api/auth/[...all]/route.ts # Better Auth catch-all handler
├── components/                    # Reusable UI components (Navbar, Reviews, etc.)
├── lib/
│   ├── actions/                   # Server actions (cart, wishlist, reviews, orders)
│   ├── auth/                      # Better Auth configuration
│   └── db/                        # Drizzle DB client & schema definitions
└── store/                         # Zustand stores (cart, wishlist)
🗄️ Database Schema
users, sessions, accounts, verifications — Authentication and user profiles
products, product_variants — Silver jewelry catalog, pricing, and variants
reviews — Customer star ratings and reviews
carts, cart_items — Guest and authenticated shopping bags
wishlists — Saved user/guest wishlist items
addresses, orders, order_items — Shipping details and COD orders