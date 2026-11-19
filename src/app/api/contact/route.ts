import { cleanEnquiry, enquirySubject, enquiryText, validateEnquiry } from "@/lib/contact";
import { site } from "@/lib/site";

/**
 * Receives the contact form.
 *
 * Delivery uses Resend's HTTP API and switches on when RESEND_API_KEY is set
 * (see README). Until then this answers 503 with `fallback: "mailto"`, and the
 * form opens the visitor's own mail app with the message filled in, so an
 * enquiry is never silently dropped.
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Email delivery isn't set up on this deployment.", fallback: "mailto" },
      { status: 503 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL || site.email;
  const from = process.env.CONTACT_FROM_EMAIL || `${site.name} Website <website@${new URL(site.url).hostname}>`;

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
      return Response.json(
        { error: "We couldn't send that just now.", fallback: "mailto" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Contact form: could not reach Resend", error);
    return Response.json({ error: "We couldn't send that just now.", fallback: "mailto" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
