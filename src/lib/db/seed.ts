import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import {
  addresses,
  cartItems,
  carts,
  categories,
  collections,
  colors,
  orderItems,
  orders,
  payments,
  productCollections,
  productImages,
  products,
  productVariants,
  reviews,
  sizes,
  genders,
  user,
  wishlists,
  couponInsertSchema,
  coupons,
  productImageInsertSchema,
  productInsertSchema,
  variantInsertSchema,
  type Dimensions,
} from "./schema";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const log = (message: string) => console.log(`[seed] ${message}`);

/** Deterministic PRNG (mulberry32) so re-seeding produces stable data. */
function createRng(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260119);

const between = (min: number, max: number) => min + rng() * (max - min);

const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)];

const pickMany = <T>(items: readonly T[], count: number): T[] => {
  const pool = [...items];
  const chosen: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
};

const money = (value: number) => value.toFixed(2);

const slugSku = (value: string) => value.replace(/-/g, "").toUpperCase();

/* -------------------------------------------------------------------------- */
/*                                Static catalog                              */
/* -------------------------------------------------------------------------- */

const GENDERS = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
] as const;

const COLORS = [
  { name: "Sterling Silver", slug: "sterling-silver", hexCode: "#C0C0C0" },
  { name: "Rhodium Plated", slug: "rhodium-plated", hexCode: "#E5E4E2" },
  { name: "White Gold Plated", slug: "white-gold-plated", hexCode: "#F0F0F0" },
] as const;

const SIZES = [
  { name: "Size 5", slug: "size-5", sortOrder: 1 },
  { name: "Size 6", slug: "size-6", sortOrder: 2 },
  { name: "Size 7", slug: "size-7", sortOrder: 3 },
  { name: "Size 8", slug: "size-8", sortOrder: 4 },
  { name: "Size 9", slug: "size-9", sortOrder: 5 },
  { name: "45cm", slug: "45cm", sortOrder: 10 },
  { name: "One Size", slug: "one-size", sortOrder: 99 },
] as const;

const CATEGORIES = [
  { name: "Rings", slug: "rings" },
  { name: "Bracelets", slug: "bracelets" },
  { name: "Necklaces", slug: "necklaces" },
  { name: "Earrings", slug: "earrings" },
] as const;

const COLLECTIONS = [
  { name: "Elegance Collection", slug: "elegance-collection" },
  { name: "Silver Serenade", slug: "silver-serenade" },
] as const;

const COUPONS = [
  { code: "WELCOME10", discountType: "percentage" as const, discountValue: "10.00", maxUsage: 1000 },
  { code: "SILVER25", discountType: "fixed" as const, discountValue: "25.00", maxUsage: 250 },
];

type CategorySlug = (typeof CATEGORIES)[number]["slug"];
type GenderSlug = (typeof GENDERS)[number]["slug"];
type ColorSlug = (typeof COLORS)[number]["slug"];
type SizeSlug = (typeof SIZES)[number]["slug"];

const CATEGORY_CODE: Record<CategorySlug, string> = {
  rings: "RNG",
  bracelets: "BRC",
  necklaces: "NCK",
  earrings: "ERG",
};

const RING_SIZES: SizeSlug[] = ["size-5", "size-6", "size-7", "size-8", "size-9"];

type SeedProduct = {
  name: string;
  description: string;
  category: CategorySlug;
  gender: GenderSlug;
  images: string[];
  collections: string[];
  basePrice: number;
  colors: ColorSlug[];
  sizeStrategy: "ring" | "chain" | "one-size";
};

/**
 * 16 products — four per category — each mapped to its own unique image from
 * `/public/products` so no two products share a photo.
 *
 * Image inventory:
 *   Rings      -> ring_01..04
 *   Bracelets  -> bracelet_01..04
 *   Necklaces  -> necklacе_01..04 (note the Cyrillic "е", matching the filename)
 *   Earrings   -> earring_01..04
 */
const PRODUCTS: SeedProduct[] = [
  {
    name: "Aurora Solitaire Ring",
    description:
      "A hand-finished sterling silver band crowned with a brilliant-cut solitaire setting. Ethically sourced and polished to a mirror shine.",
    category: "rings",
    gender: "women",
    images: ["/products/ring_01.jpg"],
    collections: ["elegance-collection"],
    basePrice: 189,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "ring",
  },
  {
    name: "Elysian Twist Band",
    description:
      "Two intertwined silver strands form an elegant twist, symbolising an unbreakable bond. A modern heirloom for everyday wear.",
    category: "rings",
    gender: "women",
    images: ["/products/ring_02.jpg"],
    collections: ["silver-serenade"],
    basePrice: 149,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "ring",
  },
  {
    name: "Sterling Signet Ring",
    description:
      "A substantial men's signet with a brushed centre and polished shoulders. Weighty, confident and timeless.",
    category: "rings",
    gender: "men",
    images: ["/products/ring_03.png"],
    collections: ["elegance-collection"],
    basePrice: 229,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "ring",
  },
  {
    name: "Meridian Dome Ring",
    description:
      "A softly domed sterling silver ring with a satin finish, designed to be worn alone or stacked as a set.",
    category: "rings",
    gender: "women",
    images: ["/products/ring_04.png"],
    collections: ["silver-serenade"],
    basePrice: 129,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "ring",
  },
  {
    name: "Serene Chain Bracelet",
    description:
      "A delicate cable chain bracelet that catches the light with every movement. Finished with a secure lobster clasp.",
    category: "bracelets",
    gender: "women",
    images: ["/products/bracelet_01.jpg"],
    collections: ["silver-serenade"],
    basePrice: 119,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Celeste Link Bracelet",
    description:
      "A luminous flat-link bracelet with a seamless clasp, crafted to sit gracefully against the wrist.",
    category: "bracelets",
    gender: "women",
    images: ["/products/bracelet_02.jpg"],
    collections: ["elegance-collection"],
    basePrice: 139,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Regal Cuff Bracelet",
    description:
      "A sculptural sterling silver cuff with softly tapered edges. Slips on effortlessly and stacks beautifully.",
    category: "bracelets",
    gender: "women",
    images: ["/products/bracelet_03.jpg"],
    collections: ["elegance-collection"],
    basePrice: 199,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "one-size",
  },
  {
    name: "Heritage Link Bracelet",
    description:
      "Bold interlocking links in a heavyweight silver finish, designed for the modern gentleman.",
    category: "bracelets",
    gender: "men",
    images: ["/products/bracelet_04.jpg"],
    collections: ["elegance-collection"],
    basePrice: 249,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Celeste Pendant Necklace",
    description:
      "A faceted silver pendant suspended on a fine chain, inspired by the night sky above the Brillivo atelier.",
    category: "necklaces",
    gender: "women",
    images: ["/products/necklacе_01.png"],
    collections: ["silver-serenade"],
    basePrice: 169,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Lumina Chain Necklace",
    description:
      "A luminous flat-link chain that lays perfectly against the collarbone. Understated luxury in solid silver.",
    category: "necklaces",
    gender: "women",
    images: ["/products/necklacе_02.png"],
    collections: ["elegance-collection"],
    basePrice: 139,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Obsidian Silver Necklace",
    description:
      "A masculine box-chain necklace with a high-polish finish and a discreet Brillivo hallmark clasp.",
    category: "necklaces",
    gender: "men",
    images: ["/products/necklacе_03.png"],
    collections: ["silver-serenade"],
    basePrice: 209,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Aria Drop Necklace",
    description:
      "A fine silver necklace with a delicate drop pendant that shimmers softly as it moves.",
    category: "necklaces",
    gender: "women",
    images: ["/products/necklacе_04.png"],
    collections: ["elegance-collection"],
    basePrice: 159,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "chain",
  },
  {
    name: "Petal Drop Earrings",
    description:
      "Sculpted silver petals cascade from a slim hook, adding a soft, feminine flourish to any look.",
    category: "earrings",
    gender: "women",
    images: ["/products/earring_01.jpg"],
    collections: ["silver-serenade"],
    basePrice: 99,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "one-size",
  },
  {
    name: "Halo Stud Earrings",
    description:
      "Everyday studs with a textured halo that frames the light. Comfortable enough to wear from morning to midnight.",
    category: "earrings",
    gender: "women",
    images: ["/products/earring_02.jpg"],
    collections: ["elegance-collection"],
    basePrice: 89,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "one-size",
  },
  {
    name: "Meridian Hoop Earrings",
    description:
      "Perfectly weighted silver hoops with a seamless closure, polished until they glow.",
    category: "earrings",
    gender: "women",
    images: ["/products/earring_03.png"],
    collections: ["silver-serenade"],
    basePrice: 109,
    colors: ["sterling-silver", "rhodium-plated"],
    sizeStrategy: "one-size",
  },
  {
    name: "Aster Huggie Earrings",
    description:
      "Petite silver huggies set with a row of hand-polished beads. A subtle sparkle for everyday styling.",
    category: "earrings",
    gender: "women",
    images: ["/products/earring_04.png"],
    collections: ["elegance-collection"],
    basePrice: 79,
    colors: ["sterling-silver", "white-gold-plated"],
    sizeStrategy: "one-size",
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Seed data                                  */
/* -------------------------------------------------------------------------- */

const REVIEWERS = [
  { email: "demo@brillivo.com", name: "Brillivo Demo" },
  { email: "amelia@brillivo.test", name: "Amelia Hart" },
  { email: "noah@brillivo.test", name: "Noah Bennett" },
  { email: "sofia@brillivo.test", name: "Sofia Marino" },
  { email: "liam@brillivo.test", name: "Liam Novak" },
] as const;

const REVIEW_COMMENTS = [
  "Absolutely stunning craftsmanship — the finish is flawless.",
  "Beautiful piece, arrived beautifully packaged. Highly recommend.",
  "Elegant and comfortable for everyday wear. Worth every penny.",
  "The silver has a lovely weight to it. Exceeded my expectations.",
  "Gorgeous in person, even better than the photos.",
  "My new favourite piece. Brillivo never disappoints.",
];

const CATEGORY_SPECS: Record<
  CategorySlug,
  { weight: [number, number]; priceJitter: number; dimensions: (w: number) => Dimensions }
> = {
  rings: {
    weight: [3, 8],
    priceJitter: 30,
    dimensions: (w) => ({ length: 2, width: 2, height: 0.4 + w * 0.02 }),
  },
  bracelets: {
    weight: [10, 25],
    priceJitter: 40,
    dimensions: () => ({ length: 19, width: 1, height: 0.5 }),
  },
  necklaces: {
    weight: [6, 18],
    priceJitter: 50,
    dimensions: () => ({ length: 45, width: 0.6, height: 0.3 }),
  },
  earrings: {
    weight: [2, 6],
    priceJitter: 25,
    dimensions: (w) => ({ length: 2.5, width: 1.2, height: 1 + w * 0.05 }),
  },
};

function resolveSizeSlugs(strategy: SeedProduct["sizeStrategy"]): SizeSlug[] {
  if (strategy === "ring") {
    return pickMany(RING_SIZES, 3).sort();
  }
  if (strategy === "chain") {
    return ["45cm"];
  }
  return ["one-size"];
}

/** Guarantees every product owns a distinct image across the whole catalog. */
function assertUniqueProductImages(): void {
  const seen = new Map<string, string>();
  for (const product of PRODUCTS) {
    for (const url of product.images) {
      const owner = seen.get(url);
      if (owner) {
        throw new Error(
          `Duplicate image "${url}" shared by "${owner}" and "${product.name}". Each product must use a unique image.`
        );
      }
      seen.set(url, product.name);
    }
  }
  log(`Catalog integrity OK: ${PRODUCTS.length} products, ${seen.size} unique images.`);
}

async function main() {
  log("Starting Brillivo seed...");

  /* ----------------------- Validate catalog integrity --------------------- */
  assertUniqueProductImages();

  /* ----------------------------- Reset content ---------------------------- */
  log("Clearing existing catalog & commerce data (auth users preserved until re-seeded)...");

  await db.execute(sql`
    TRUNCATE TABLE
      order_items,
      payments,
      orders,
      cart_items,
      carts,
      wishlists,
      reviews,
      product_collections,
      product_images,
      product_variants,
      products,
      collections,
      categories,
      colors,
      sizes,
      genders,
      coupons
    RESTART IDENTITY CASCADE
  `);

  await db
    .delete(user)
    .where(inArray(user.email, REVIEWERS.map((reviewer) => reviewer.email)));

  /* -------------------------------- Filters ------------------------------- */
  const genderRows = await db.insert(genders).values([...GENDERS]).returning();
  const colorRows = await db.insert(colors).values([...COLORS]).returning();
  const sizeRows = await db.insert(sizes).values([...SIZES]).returning();
  log(`Inserted ${genderRows.length} genders, ${colorRows.length} colors, ${sizeRows.length} sizes.`);

  const genderIdBySlug = new Map(genderRows.map((row) => [row.slug, row.id]));
  const colorIdBySlug = new Map(colorRows.map((row) => [row.slug, row.id]));
  const sizeIdBySlug = new Map(sizeRows.map((row) => [row.slug, row.id]));

  /* --------------------------- Categories & collections ------------------- */
  const categoryRows = await db.insert(categories).values([...CATEGORIES]).returning();
  const collectionRows = await db.insert(collections).values([...COLLECTIONS]).returning();
  log(`Inserted ${categoryRows.length} categories, ${collectionRows.length} collections.`);

  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const collectionIdBySlug = new Map(collectionRows.map((row) => [row.slug, row.id]));

  /* --------------------------------- Coupons ------------------------------ */
  const validatedCoupons = COUPONS.map((coupon) => couponInsertSchema.parse(coupon));
  const couponRows = await db.insert(coupons).values(validatedCoupons).returning();
  log(`Inserted ${couponRows.length} coupons.`);

  /* --------------------------------- Users -------------------------------- */
  const userRows = await db
    .insert(user)
    .values(
      REVIEWERS.map((reviewer) => ({
        name: reviewer.name,
        email: reviewer.email,
        emailVerified: true,
      }))
    )
    .returning();

  const demoUser = userRows.find((row) => row.email === "demo@brillivo.com")!;
  log(`Inserted ${userRows.length} users (demo id: ${demoUser.id}).`);

  const addressRows = await db
    .insert(addresses)
    .values([
      {
        userId: demoUser.id,
        type: "shipping",
        line1: "12 Kingsway",
        line2: "Apartment 4B",
        city: "London",
        state: "Greater London",
        country: "United Kingdom",
        postalCode: "WC2B 6UN",
        isDefault: true,
      },
      {
        userId: demoUser.id,
        type: "billing",
        line1: "12 Kingsway",
        city: "London",
        state: "Greater London",
        country: "United Kingdom",
        postalCode: "WC2B 6UN",
        isDefault: true,
      },
    ])
    .returning();

  const shippingAddress = addressRows.find((row) => row.type === "shipping")!;
  const billingAddress = addressRows.find((row) => row.type === "billing")!;
  log(`Inserted ${addressRows.length} addresses for demo user.`);

  /* -------------------------------- Catalog ------------------------------- */
  let variantCounter = 0;
  const createdVariants: { id: string; price: string }[] = [];

  for (let index = 0; index < PRODUCTS.length; index += 1) {
    const seedProduct = PRODUCTS[index];
    const categoryId = categoryIdBySlug.get(seedProduct.category);
    const genderId = genderIdBySlug.get(seedProduct.gender);

    if (!categoryId || !genderId) {
      throw new Error(`Missing category/gender for product "${seedProduct.name}".`);
    }

    const productPayload = productInsertSchema.parse({
      name: seedProduct.name,
      description: seedProduct.description,
      categoryId,
      genderId,
      isPublished: true,
      defaultVariantId: null,
    });

    const [productRow] = await db.insert(products).values(productPayload).returning();

    const spec = CATEGORY_SPECS[seedProduct.category];
    const sizeSlugs = resolveSizeSlugs(seedProduct.sizeStrategy);
    const chosenColors = pickMany(seedProduct.colors, rng() > 0.5 ? 2 : 1);
    const categoryCode = CATEGORY_CODE[seedProduct.category];
    const productNumber = String(index + 1).padStart(3, "0");

    const variantPayloads: (typeof productVariants.$inferInsert)[] = [];
    for (const colorSlug of chosenColors) {
      for (const sizeSlug of sizeSlugs) {
        const colorId = colorIdBySlug.get(colorSlug);
        const sizeId = sizeIdBySlug.get(sizeSlug);
        if (!colorId || !sizeId) {
          throw new Error(`Missing color/size for product "${seedProduct.name}".`);
        }

        variantCounter += 1;
        const weight = Number(between(spec.weight[0], spec.weight[1]).toFixed(2));
        const base = seedProduct.basePrice + between(0, spec.priceJitter);
        const price = base;
        const hasSale = rng() > 0.65;
        const salePrice = hasSale ? price * 0.85 : undefined;

        const payload = variantInsertSchema.parse({
          productId: productRow.id,
          sku: `BRV-${categoryCode}${productNumber}-${slugSku(colorSlug)}-${slugSku(sizeSlug)}`,
          price: money(price),
          salePrice: salePrice !== undefined ? money(salePrice) : null,
          colorId,
          sizeId,
          inStock: Math.floor(between(4, 40)),
          weight,
          dimensions: spec.dimensions(weight),
        });

        variantPayloads.push(payload);
      }
    }

    const variantRows = await db.insert(productVariants).values(variantPayloads).returning();

    if (variantRows.length === 0) {
      throw new Error(`Product "${seedProduct.name}" produced no variants.`);
    }

    const defaultVariant = variantRows[0];
    await db
      .update(products)
      .set({ defaultVariantId: defaultVariant.id })
      .where(eq(products.id, productRow.id));

    createdVariants.push({ id: defaultVariant.id, price: defaultVariant.price });

    const imagePayloads = seedProduct.images.map((url, imageIndex) =>
      productImageInsertSchema.parse({
        productId: productRow.id,
        variantId: imageIndex === 0 ? defaultVariant.id : null,
        url,
        sortOrder: imageIndex,
        isPrimary: imageIndex === 0,
      })
    );
    await db.insert(productImages).values(imagePayloads);

    if (seedProduct.collections.length > 0) {
      await db.insert(productCollections).values(
        seedProduct.collections.map((collectionSlug) => {
          const collectionId = collectionIdBySlug.get(collectionSlug);
          if (!collectionId) {
            throw new Error(`Missing collection "${collectionSlug}".`);
          }
          return { productId: productRow.id, collectionId };
        })
      );
    }

    log(
      `  • ${seedProduct.name} -> ${variantRows.length} variants, ${imagePayloads.length} images`
    );
  }

  log(`Inserted ${PRODUCTS.length} products and ${variantCounter} variants.`);

  /* -------------------------------- Reviews ------------------------------- */
  const createdProducts = await db
    .select({ id: products.id })
    .from(products);

  const reviewValues = createdProducts.flatMap((productRow) => {
    const reviewers = pickMany(userRows, Math.floor(between(1, 4)));
    return reviewers.map((reviewer) => ({
      productId: productRow.id,
      userId: reviewer.id,
      rating: Math.floor(between(3, 6)),
      comment: pick(REVIEW_COMMENTS),
    }));
  });

  if (reviewValues.length > 0) {
    await db.insert(reviews).values(reviewValues);
  }
  log(`Inserted ${reviewValues.length} reviews.`);

  /* ------------------------------- Wishlists ------------------------------ */
  const wishlistTargets = pickMany(createdProducts, 4);
  await db.insert(wishlists).values(
    wishlistTargets.map((productRow) => ({
      userId: demoUser.id,
      productId: productRow.id,
    }))
  );
  log(`Inserted ${wishlistTargets.length} wishlist entries for demo user.`);

  /* ---------------------------------- Cart -------------------------------- */
  const [cartRow] = await db.insert(carts).values({ userId: demoUser.id }).returning();

  const cartVariantTargets = pickMany(createdVariants, 3);
  await db.insert(cartItems).values(
    cartVariantTargets.map((variant) => ({
      cartId: cartRow.id,
      productVariantId: variant.id,
      quantity: Math.floor(between(1, 3)),
    }))
  );
  log(`Inserted 1 cart with ${cartVariantTargets.length} items for demo user.`);

  /* --------------------------------- Order -------------------------------- */
  const orderVariantTargets = pickMany(createdVariants, 2);
  const orderItemsPayload = orderVariantTargets.map((variant) => ({
    productVariantId: variant.id,
    quantity: Math.floor(between(1, 2)),
    priceAtPurchase: variant.price,
  }));

  const totalAmount = orderItemsPayload
    .reduce((sum, item) => sum + Number(item.priceAtPurchase) * item.quantity, 0)
    .toFixed(2);

  const [orderRow] = await db
    .insert(orders)
    .values({
      userId: demoUser.id,
      status: "paid",
      totalAmount,
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
    })
    .returning();

  await db
    .insert(orderItems)
    .values(orderItemsPayload.map((item) => ({ ...item, orderId: orderRow.id })));

  await db.insert(payments).values({
    orderId: orderRow.id,
    method: "stripe",
    status: "completed",
    paidAt: new Date(),
    transactionId: `txn_${orderRow.id.replace(/-/g, "").slice(0, 18)}`,
  });
  log(`Inserted 1 order (${totalAmount}) with ${orderItemsPayload.length} items and a payment.`);

  log("Seed completed successfully.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[seed][error] Seeding failed:");
    console.error(error);
    process.exit(1);
  });

export { main };
