/** Shared between the contact form and the endpoint it posts to. */

export const NEEDS = ["Website", "SEO", "Instagram", "Custom tool", "Not sure yet"] as const;
export type Need = (typeof NEEDS)[number];

export const LIMITS = { name: 120, email: 200, business: 160, message: 4000 } as const;

export type Enquiry = {
  name: string;
  email: string;
  business: string;
  needs: string[];
  message: string;
};

export type EnquiryErrors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims and bounds whatever came in, so the same rules apply in the browser and on the server. */
export function cleanEnquiry(input: unknown): Enquiry {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const needs = Array.isArray(raw.needs)
    ? raw.needs.filter((n): n is Need => typeof n === "string" && (NEEDS as readonly string[]).includes(n))
    : [];
  return {
    name: text(raw.name, LIMITS.name),
    email: text(raw.email, LIMITS.email),
    business: text(raw.business, LIMITS.business),
    needs: [...new Set(needs)],
    message: text(raw.message, LIMITS.message),
  };
}

export function validateEnquiry(enquiry: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!enquiry.name) errors.name = "Tell us your name.";
  if (!enquiry.email) errors.email = "We need an email to reply to.";
  else if (!EMAIL.test(enquiry.email)) errors.email = "That email doesn't look right.";
  if (!enquiry.message) errors.message = "A line or two about what you need.";
  return errors;
}

/** The plain-text body used for both the delivered email and the mail-app fallback. */
export function enquiryText(enquiry: Enquiry) {
  return [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
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
