# APXS

The website for APXS: websites, SEO, Instagram and custom tools for Australian businesses.

One long page, built to show the kind of work APXS does: a Framer Motion intro, a hero where
real client sites stand in a slowly turning 3D ring over a flowing glow, animated demos of
each service, and a portfolio of real client sites (only one of them shown by name).

## Before you launch

The site is ready to deploy, but a few details were filled in as placeholders. They all
live in `src/lib/site.ts`:

- [ ] **`email`**: currently `support@apxs.com.au`. Every "email us" link and the contact form
      send to this address, so it must be a real inbox.
- [ ] **`phone`** and **`instagram`**: blank, which hides them. Add them if you want them shown.
- [ ] **`location`** and **`timeZone`**: currently `Australia` and Sydney time (the live clock).
- [ ] **`url`**: currently `https://apxs.com.au`. Change it if the site will live elsewhere.
- [ ] Optional: add a `RESEND_API_KEY` so enquiries arrive in your inbox directly
      (see [Contact form](#contact-form)).

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. Other scripts: `npm run build`, `npm run start`,
`npm run lint` and `npm run format`.

Needs Node 20.9 or newer.

## Change the content

Almost everything you would want to edit lives in two files.

| What                                                              | Where                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Business name, email, phone, Instagram, location, clock time zone | `src/lib/site.ts`                                               |
| Services, process steps, page description                         | `src/lib/site.ts`                                               |
| Portfolio projects (name, blurb, link, card colours)              | `src/lib/projects.ts`                                           |
| Portfolio screenshots                                             | `src/assets/work/`                                              |
| Headlines and section copy                                        | the matching file in `src/components/sections/`                 |
| Colours, fonts, type styles                                       | `src/app/globals.css` (`@theme` block) and `src/app/layout.tsx` |

Leave `phone` or `instagram` blank in `site.ts` and they are hidden everywhere, including the
structured data.

### Add a portfolio project

1. Capture the client's site from the top of the page down: a desktop screenshot
   2160 x 4000 pixels and a mobile one 780 x 2920. The card scrolls through them, and those
   heights are exactly as much as it ever shows (anything longer is wasted download).
2. Save both as `.webp` in `src/assets/work/`.
3. Add an entry to `src/lib/projects.ts`, following the existing ones. `theme` sets the card's
   colours; take them from the client's own brand. `tint` is the flat colour each screen
   shows for the moment before its capture has loaded: use the page's background colour.
4. To put the project on the hero's wall as well, cut a few 1280 x 800 screens out of the
   desktop capture, save them in `src/assets/showcase/`, and add them to the list in
   `src/lib/showcase.ts`. Any number of screens works (the ring spaces itself); keep
   neighbours in the list from different clients.

## Contact form

The form posts to `src/app/api/contact/route.ts`. It asks for a phone number rather than an
email (as does the booking form on /book): the call back is how we reply.

- **Out of the box** it needs no setup. With nothing configured, the form opens the
  visitor's own mail app with their message filled in and addressed to the email in
  `site.ts`.
- **To send every lead straight into APECS** (or any other platform or chat that accepts
  a webhook), set `LEADS_WEBHOOK_URL` to the address it gives you. See below.
- **To have enquiries emailed to you**, create a [Resend](https://resend.com) API key and
  set `RESEND_API_KEY`.

Either one, or both, can be set (in Vercel: Project, Settings, Environment Variables, then
redeploy). With either, the form sends in-page and shows a confirmation; with both, each
lead goes to both places.

| Variable               | What it does                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `LEADS_WEBHOOK_URL`    | Where each lead is posted: the APECS main chat's webhook address, for example.                    |
| `LEADS_WEBHOOK_SECRET` | Optional. Sent as `Authorization: Bearer <secret>`, for platforms that ask for a key.             |
| `LEADS_WEBHOOK_FORMAT` | Optional: `discord`, `slack`, `google-chat` or `json`. Worked out from the address when left out. |
| `RESEND_API_KEY`       | Turns on email delivery.                                                                          |
| `CONTACT_TO_EMAIL`     | Where emails go. Defaults to the email in `site.ts`.                                              |
| `CONTACT_FROM_EMAIL`   | The sender. Defaults to `website@` your domain, which must be verified with Resend.               |

**For APXS** the live site sends leads to APECS: `LEADS_WEBHOOK_URL` is
`https://apecs1.vercel.app/api/leads/website`, and the `LEADS_WEBHOOK_SECRET` in this project's
settings must match the one in the APECS project's settings (APECS's SETUP.md, part 6). Each
lead then appears in APECS under Leads to contact, with a notification.

**What the webhook receives.** Discord and Slack channel webhooks and Google Chat spaces get
a readable message (name, phone number, business, what they need, and their message). Any other
address gets the lead as JSON:

```json
{
  "type": "lead",
  "source": "apxs.com.au",
  "submittedAt": "2026-11-26T07:32:04.009Z",
  "name": "Jordan Smith",
  "phone": "0412 345 678",
  "business": "Jordan Plumbing",
  "needs": ["Website", "SEO"],
  "message": "We need a site that gets us more calls.",
  "subject": "New enquiry from Jordan Plumbing",
  "text": "Name: Jordan Smith\nPhone: …"
}
```

The webhook address is as good as a password (anyone who has it can post to that chat), so
keep it in Vercel's settings rather than in the code. See `.env.example`. If delivery ever
fails, the form falls back to the mail app rather than losing the message. A hidden
honeypot field filters out basic bots, which are never forwarded.

## Booking a call (/book)

`apxs.com.au/book` goes straight to booking a free 10-minute call, with no intro: pick a day,
pick a time, give a name and phone number, done. It is a link to share on its own
(an Instagram bio, an email signature, a message). "See the main site" on it is a full page
load, so the home page plays its intro as usual. The home page leads there too: the hero's
main button ("Book a free call"), the top bar on wide screens, the phone menu, the contact
section and the footer (all through `bookHref` in `src/lib/site.ts`).

- **The times come from APECS**, which keeps the calendar: every day (weekends too) from 9 am to a last call at 9:30 pm Sydney time,
  every 15 minutes, at least an hour ahead, up to about six months out, and never over anything
  already in its Calendar. Visitors see them in their own time zone (with Sydney's alongside).
- **Each booking lands in APECS's Calendar** as "Call: name (business)", with their phone
  number and what they want to talk about, and both of you get a notification. The
  visitor gets links to put the call in Google Calendar or Apple / Outlook.
- **Nothing to set up for APXS**: when `LEADS_WEBHOOK_URL` is APECS's website-leads address
  (`…/api/leads/website`), bookings go to the address next to it (`…/api/calls/website`) with
  the same `LEADS_WEBHOOK_SECRET`. Only the server talks to APECS; the key never reaches the
  browser. To send bookings somewhere else, set `BOOKING_API_URL` and `BOOKING_API_SECRET`.
- **If APECS can't be reached** (or every time is taken), the page says so and offers an
  email with everything already filled in, so a booking is never lost. Someone grabbing the
  same time a moment earlier is told to pick another, and keeps what they typed.
- `src/app/book/page.tsx` is the page, `src/components/booking/BookingPanel.tsx` the picker
  and form, `src/lib/booking.ts` the shared rules and date formatting, `src/lib/calls.ts` the
  link to APECS, and `src/app/api/book/` the two endpoints the page calls. A hidden honeypot
  field and a limit of four bookings an hour from one place keep bots out.

## Deploy

It is a standard Next.js app. On Vercel: import the repository and deploy; no configuration
is needed. Point `apxs.com.au` at the project, and if the domain is different, update `url`
in `src/lib/site.ts` so the canonical URL, sitemap and share image follow.

## How it is put together

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4** and **Framer Motion**.
  Scrolling is the browser's own; nothing sits between the visitor and the page.
- `src/components/Intro.tsx`: the opening sequence, played in full on every visit to the
  home page: four words rolling past in 3D, then the wordmark, then two curtains lifting.
  The curtain is part of the page's HTML, so it is on screen from the first paint, before
  any script has loaded. The wordmark shares a `layoutId` with the header logo, which is
  how it flies into place.
- `src/components/LogoAssemble.tsx`: the wordmark's entrance in that sequence. Four solid
  letters swing in and lock together, the tip of the A catches light, and a band of colour
  runs through them. It is all CSS keyframes (in `globals.css`, under "Intro: the
  wordmark"), so it plays smoothly however busy the page is while it loads.
- `src/lib/motion.ts`: decides how much the site moves (see [Animations on or
  off](#animations-on-or-off)). Components ask through `useReducedMotion`; the stylesheet
  reads `data-motion` on `<html>`.
- `src/components/Showcase.tsx`: the hero's wall of work. Ordinary images placed in a ring
  with CSS 3D, turned by a single CSS animation, so the graphics card does all of it and
  it works before (or without) JavaScript. Everything on top of the steady turn (the spin
  it arrives with, a flick, a click that brings a screen round to the front) is
  one eased animation handed to the browser, so no script runs per frame.
- `src/components/sections/Hero.tsx`: the hero: the headline over the wall of work and the glow.
  It is one screen tall and scrolls away with the page.
- `src/components/Aurora.tsx`: the glow behind the hero, the contact form and the 404 page.
  A small shader drawn at a fraction of its displayed size (soft light has no detail to
  lose) at 30 frames a second, paused whenever it is off screen. Where there is no WebGL,
  or no graphics acceleration, a still CSS gradient in the same colours shows instead.
- `src/components/demos/`: the four small service animations. Each is only created when
  its stage is about to scroll into view, and only runs while it is on screen. The stages
  they sit on lean toward the mouse (`src/hooks/useTilt.ts`).
- `src/components/ui/VelocityMarquee.tsx`: the moving rows of words (the two rows under the
  hero, which pass each other in opposite directions, and the band above the contact form).
  One looping animation each, at one steady speed.
- `src/components/sections/`: one file per section of the page.

### Keeping it fast

The site is animation-heavy, so it follows a few rules. Worth keeping to when you add to it.

- **Animate only `transform`, `opacity` and `clip-path`.** The browser runs those on the
  graphics card, off the main thread, so they stay smooth while the page is busy. With
  Framer Motion that means writing `animate={{ transform: "translateY(0px)" }}` rather
  than animating `height`, `top`, colours or using `layout`.
- **Nothing runs when it cannot be seen.** The marquee, the demos, the wall of work and the
  glows all stop when they are off screen.
- **No blur filters, backdrop blurs or blend-mode overlays over large areas.** Glows are
  plain gradients. These effects look cheap to write and are expensive to draw, most of
  all on phones.
- **Images are sized for where they are drawn.** The portfolio captures are trimmed, served
  as WebP and capped at 1440 pixels wide (`next.config.ts`).
- **Some animations quietly fall back to the main thread**, where they are redrawn by the
  page on every frame and make everything else on it more expensive. Three to watch for:
  two animations of the same property on one element at once (give each its own element,
  or write them as one set of keyframes, as the intro's logo does); an animation running on
  something hidden (the hero's scroll hint waits for the curtain to lift); and anything
  driven by script frame by frame that the browser could run itself (the intro's counter
  and the logo's flight into the header are each started once and left to the browser).

### Built in

- **Accessibility**: real headings and landmarks, visible focus styles, a skip link, labelled
  form fields with inline errors, and a switch that stops the animations (below).
- **Without JavaScript** the page still shows all of its content.
- **SEO**: metadata, Open Graph image, structured data (`ProfessionalService`), sitemap,
  robots and a web manifest are generated from `src/lib/site.ts`.

### Animations on or off

Every visitor gets the full animations, whatever their device's "reduce motion" setting
says. Anyone who would rather the page held still can switch them off (and on again) with
the "Animations" switch at the foot of the page; the choice is remembered in that browser.
Adding `?motion=reduced` or `?motion=full` to the address does the same for one visit.

Nothing reacts to scrolling speed: the wall of work and the rows of words each move at one
steady pace, and the hero scrolls away like any other section.

`AGENTS.md` is written by Next.js for AI coding tools; it is safe to leave as it is.
