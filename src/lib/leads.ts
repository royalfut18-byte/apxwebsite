import type { Enquiry } from "./contact";
import { enquirySubject, enquiryText } from "./contact";

/**
 * Sends each enquiry from the contact form to a lead inbox: a "webhook" address that the
 * receiving platform gives you (APXS uses it to put leads in the APECS main chat).
 *
 * Set it up with two environment variables on the server (in Vercel: Project, Settings,
 * Environment Variables), then redeploy:
 *
 *   LEADS_WEBHOOK_URL     the address to post each lead to (required)
 *   LEADS_WEBHOOK_SECRET  optional; sent as "Authorization: Bearer <secret>" for platforms
 *                         that ask for a key
 *   LEADS_WEBHOOK_FORMAT  optional; "discord", "slack", "google-chat" or "json". Worked out
 *                         from the address when left out.
 *
 * Chat platforms each want their own message shape, so the message is written to suit the
 * address: Discord and Slack channel webhooks and Google Chat spaces get a readable message,
 * and anything else gets the lead as plain JSON (with a ready-made `text` summary as well).
 */

export type LeadFormat = "discord" | "slack" | "google-chat" | "json";

export type Lead = Enquiry & {
  /** When it was sent, as an ISO date. */
  submittedAt: string;
  /** Where it came from, e.g. "apxs.com.au". */
  source: string;
};

const FORMATS: LeadFormat[] = ["discord", "slack", "google-chat", "json"];

export function leadFormat(url: URL, override?: string | null): LeadFormat {
  const chosen = (override || "").trim().toLowerCase() as LeadFormat;
  if (FORMATS.includes(chosen)) return chosen;
  const host = url.hostname.toLowerCase();
  if (/(^|\.)discord(app)?\.com$/.test(host) && url.pathname.includes("/webhooks/")) return "discord";
  if (host === "hooks.slack.com") return "slack";
  if (host === "chat.googleapis.com") return "google-chat";
  return "json";
}

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

/** Slack reads <, > and & as markup (links, mentions), so a visitor's words are escaped. */
const slackSafe = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function leadBody(lead: Lead, format: LeadFormat): unknown {
  const subject = enquirySubject(lead);
  const text = enquiryText(lead);

  if (format === "discord") {
    const fields = [
      { name: "Name", value: clip(lead.name, 1024), inline: true },
      { name: "Email", value: clip(lead.email, 1024), inline: true },
      ...(lead.business ? [{ name: "Business", value: clip(lead.business, 1024), inline: true }] : []),
      ...(lead.needs.length ? [{ name: "Interested in", value: clip(lead.needs.join(", "), 1024) }] : []),
    ];
    return {
      username: "APXS website",
      embeds: [
        {
          title: clip(subject, 256),
          description: clip(lead.message, 4096),
          color: 0xff5b2e,
          fields,
          footer: { text: `New lead · ${lead.source}` },
          timestamp: lead.submittedAt,
        },
      ],
      // A visitor typing "@everyone" must not ping the whole server.
      allowed_mentions: { parse: [] },
    };
  }

  if (format === "slack") {
    return { text: `*${slackSafe(subject)}* (${slackSafe(lead.source)})\n${slackSafe(text)}` };
  }

  if (format === "google-chat") {
    return { text: `*${subject}* (${lead.source})\n${text}` };
  }

  return {
    type: "lead",
    source: lead.source,
    submittedAt: lead.submittedAt,
    name: lead.name,
    email: lead.email,
    business: lead.business,
    needs: lead.needs,
    message: lead.message,
    subject,
    text,
  };
}

/**
 * Posts a lead to the configured webhook. Returns `null` when none is configured, otherwise
 * whether it was accepted.
 */
export async function sendLeadToWebhook(lead: Lead, env: NodeJS.ProcessEnv = process.env) {
  const address = env.LEADS_WEBHOOK_URL?.trim();
  if (!address) return null;

  let url: URL;
  try {
    url = new URL(address);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("not a web address");
  } catch {
    console.error("Contact form: LEADS_WEBHOOK_URL is not a valid web address");
    return false;
  }

  const format = leadFormat(url, env.LEADS_WEBHOOK_FORMAT);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = env.LEADS_WEBHOOK_SECRET?.trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(leadBody(lead, format)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // The address itself is never logged: it is as good as a password.
      console.error(
        `Contact form: the lead webhook (${url.hostname}) answered ${response.status}`,
        (await response.text().catch(() => "")).slice(0, 300),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Contact form: could not reach the lead webhook (${url.hostname})`, error);
    return false;
  }
}
