/** Shared between the contact form and the endpoint it posts to. */

export const NEEDS = ["Website", "SEO", "Instagram", "Custom tool", "Not sure yet"] as const;
export type Need = (typeof NEEDS)[number];

/** 25 characters is room for any phone number, "+61 (0)412 345 678" included (APECS takes no more). */
export const LIMITS = { name: 120, phone: 25, business: 160, message: 4000 } as const;

export type Enquiry = {
  name: string;
  /** How we get back to them: the form asks for a phone number, not an email. */
  phone: string;
  business: string;
  needs: string[];
  message: string;
};

export type EnquiryErrors = Partial<Record<"name" | "phone" | "message", string>>;

/** A phone number: digits, spaces, + ( ) - and dots, with at least eight digits. Shared with the booking form. */
export const isPhone = (value: string) =>
  /^[0-9+()\-.\s]+$/.test(value) && value.replace(/\D/g, "").length >= 8;

/** Trims and bounds whatever came in, so the same rules apply in the browser and on the server. */
export function cleanEnquiry(input: unknown): Enquiry {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const needs = Array.isArray(raw.needs)
    ? raw.needs.filter((n): n is Need => typeof n === "string" && (NEEDS as readonly string[]).includes(n))
    : [];
  return {
    name: text(raw.name, LIMITS.name),
    phone: text(raw.phone, LIMITS.phone),
    business: text(raw.business, LIMITS.business),
    needs: [...new Set(needs)],
    message: text(raw.message, LIMITS.message),
  };
}

export function validateEnquiry(enquiry: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!enquiry.name) errors.name = "Tell us your name.";
  if (!enquiry.phone) errors.phone = "We need a number to call you back on.";
  else if (!isPhone(enquiry.phone)) errors.phone = "That number doesn't look right.";
  if (!enquiry.message) errors.message = "A line or two about what you need.";
  return errors;
}

/** The plain-text body used for both the delivered email and the mail-app fallback. */
export function enquiryText(enquiry: Enquiry) {
  return [
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    enquiry.business ? `Business: ${enquiry.business}` : null,
    enquiry.needs.length ? `Interested in: ${enquiry.needs.join(", ")}` : null,
    "",
    enquiry.message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function enquirySubject(enquiry: Enquiry) {
  const who = enquiry.business || enquiry.name;
  return `New enquiry from ${who}`.replace(/[\r\n]+/g, " ").slice(0, 180);
}
