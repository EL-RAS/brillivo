/**
 * Order presentation helpers.
 *
 * Kept free of server-only imports so both the checkout island (client) and the
 * order confirmation page (server) can share the exact same formatting.
 */

const ORDER_REFERENCE_PREFIX = "BRV";

/** Turns an order UUID into the short reference shown to customers. */
export function formatOrderNumber(orderId: string): string {
  const compact = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `${ORDER_REFERENCE_PREFIX}-${compact.slice(0, 8) || "00000000"}`;
}

/** Formats a numeric/decimal amount as USD, tolerating `numeric` string columns. */
export function formatMoney(value: number | string | null | undefined): string {
  const parsed = typeof value === "string" ? Number(value) : value;
  const amount = typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
  return `$${amount.toFixed(2)}`;
}

/* -------------------------------------------------------------------------- */
/*  Contact details encoded into the address `line2` column                   */
/* -------------------------------------------------------------------------- */

/**
 * The `addresses` table has no dedicated name/phone/notes columns, so the
 * checkout stores those details in `line2` using a small, versioned, delimited
 * payload. The prefix keeps plain legacy addresses readable — anything that
 * does not start with `BRV1|` is treated as free-form text.
 *
 * Field limits keep the encoded value comfortably inside the 255-char column:
 * 4 + 1 + 80 + 1 + 32 + 1 + 40 + 1 + 80 = 240.
 */
export const ADDRESS_CONTACT_PREFIX = "BRV1";

export const ADDRESS_CONTACT_LIMITS = {
  fullName: 80,
  phone: 32,
  building: 40,
  notes: 80,
} as const;

export type AddressContact = {
  fullName: string;
  phone: string;
  building: string;
  notes: string;
};

const EMPTY_CONTACT: AddressContact = {
  fullName: "",
  phone: "",
  building: "",
  notes: "",
};

function cleanPart(value: string | undefined | null, max: number): string {
  return (value ?? "").replace(/\|/g, "/").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Encodes the checkout contact fields into a single `line2` value. */
export function encodeAddressContact(contact: Partial<AddressContact>): string {
  return [
    ADDRESS_CONTACT_PREFIX,
    cleanPart(contact.fullName, ADDRESS_CONTACT_LIMITS.fullName),
    cleanPart(contact.phone, ADDRESS_CONTACT_LIMITS.phone),
    cleanPart(contact.building, ADDRESS_CONTACT_LIMITS.building),
    cleanPart(contact.notes, ADDRESS_CONTACT_LIMITS.notes),
  ].join("|");
}

/** Decodes a `line2` value, falling back to free-form display text. */
export function decodeAddressContact(line2: string | null | undefined): AddressContact {
  if (!line2) return { ...EMPTY_CONTACT };

  const parts = line2.split("|");
  if (parts[0] !== ADDRESS_CONTACT_PREFIX) {
    return { ...EMPTY_CONTACT, notes: line2 };
  }

  return {
    fullName: parts[1] ?? "",
    phone: parts[2] ?? "",
    building: parts[3] ?? "",
    notes: parts[4] ?? "",
  };
}
