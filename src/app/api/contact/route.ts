import { cleanEnquiry, enquirySubject, enquiryText, validateEnquiry, type Enquiry } from "@/lib/contact";
import { sendLeadToWebhook } from "@/lib/leads";
import { site } from "@/lib/site";

/**
 * Receives the contact form, and delivers each enquiry in up to two ways (see README):
 *
 *  - to a lead inbox, such as the APECS main chat, when LEADS_WEBHOOK_URL is set
 *    (see lib/leads.ts);
 *  - by email through Resend's HTTP API, when RESEND_API_KEY is set.
 *
 * The visitor is told it went through if either way worked. With neither set up, or if
 * every way failed, it answers with `fallback: "mailto"`, and the form opens the visitor's
 * own mail app with the message filled in, so an enquiry is never silently dropped.
 */

const MAX_BODY_BYTES = 16_000;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return Response.json({ error: "That message is too long." }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  // Honeypot: a field people never see. Bots fill it; they get a polite success and nothing is sent.
  if (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Record<string, unknown>).website === "string" &&
    (payload as Record<string, unknown>).website !== ""
  ) {
    return Response.json({ ok: true });
  }

  const enquiry = cleanEnquiry(payload);
  const errors = validateEnquiry(enquiry);
  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Please check the form.", fields: errors }, { status: 422 });
  }

  const [inbox, email] = await Promise.all([
    sendLeadToWebhook({
      ...enquiry,
      submittedAt: new Date().toISOString(),
      source: new URL(site.url).hostname,
    }),
    sendEmail(enquiry),
  ]);

  // Nothing set up to deliver it: the visitor's own mail app takes over.
  if (inbox === null && email === null) {
    return Response.json({ ok: false, fallback: "mailto" });
  }
  if (inbox || email) {
    return Response.json({ ok: true });
  }
  return Response.json({ error: "We couldn't send that just now.", fallback: "mailto" }, { status: 502 });
}

/** Emails the enquiry through Resend. `null` when no key is set, otherwise whether it was accepted. */
async function sendEmail(enquiry: Enquiry) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const to = process.env.CONTACT_TO_EMAIL || site.email;
  const from =
    process.env.CONTACT_FROM_EMAIL || `${site.name} Website <website@${new URL(site.url).hostname}>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: enquiry.email,
        subject: enquirySubject(enquiry),
        text: enquiryText(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Contact form: Resend rejected the message", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Contact form: could not reach Resend", error);
    return false;
  }
}
