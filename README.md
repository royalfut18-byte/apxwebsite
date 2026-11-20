# APX

The website for APX: websites, SEO, Instagram and custom tools for Australian businesses.

One long page, built to show the kind of work APX does: a Framer Motion intro, a hero where
real client sites stand in a slowly turning 3D ring over a flowing glow, animated demos of
each service, and a portfolio of real, live client sites.

## Before you launch

The site is ready to deploy, but a few details were filled in as placeholders. They all
live in `src/lib/site.ts`:

- [ ] **`email`**: currently `hello@apx.com.au`. Every "email us" link and the contact form
      send to this address, so it must be a real inbox.
- [ ] **`phone`** and **`instagram`**: blank, which hides them. Add them if you want them shown.
- [ ] **`location`** and **`timeZone`**: currently `Australia` and Sydney time (the live clock).
- [ ] **`url`**: currently `https://apx.com.au`. Change it if the site will live elsewhere.
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

The form posts to `src/app/api/contact/route.ts`.

- **Out of the box** it needs no setup. With no mail service configured, the form opens the
  visitor's own mail app with their message filled in and addressed to the email in
  `site.ts`.
- **To deliver enquiries straight to your inbox**, create a [Resend](https://resend.com) API
  key and set the variables below (in Vercel: Project, Settings, Environment Variables).
  The form then sends in-page and shows a confirmation.

| Variable             | Required | What it does                                                                        |
| -------------------- | -------- | ----------------------------------------------------------------------------------- |
| `RESEND_API_KEY`     | yes      | Turns on in-page delivery.                                                          |
| `CONTACT_TO_EMAIL`   | no       | Where enquiries are sent. Defaults to the email in `site.ts`.                       |
| `CONTACT_FROM_EMAIL` | no       | The sender. Defaults to `website@` your domain, which must be verified with Resend. |

See `.env.example`. If delivery ever fails, the form falls back to the mail app rather than
losing the message. A hidden honeypot field filters out basic bots.

## Deploy

It is a standard Next.js app. On Vercel: import the repository and deploy; no configuration
is needed. Point `apx.com.au` at the project, and if the domain is different, update `url`
in `src/lib/site.ts` so the canonical URL, sitemap and share image follow.

## How it is put together

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4** and **Framer Motion**.
  Scrolling is the browser's own; nothing sits between the visitor and the page.
- `src/components/Intro.tsx`: the opening sequence, played in full on every visit to the
  home page. The curtain is part of the page's HTML, so it is on screen from the first
  paint, before any script has loaded. The wordmark shares a `layoutId` with the header
  logo, which is how it flies into place.
- `src/components/Showcase.tsx`: the hero's wall of work. Ordinary images placed in a ring
  with CSS 3D, turned by a single CSS animation, so the graphics card does all of it and
  it works before (or without) JavaScript. Script only changes the animation's speed or
  position: when it is dragged, when the page scrolls, and for the spin it arrives with.
- `src/components/Aurora.tsx`: the glow behind the hero, the contact form and the 404 page.
  A small shader drawn at a fraction of its displayed size (soft light has no detail to
  lose) at 30 frames a second, paused whenever it is off screen. Where there is no WebGL,
  or no graphics acceleration, a still CSS gradient in the same colours shows instead.
- `src/components/demos/`: the four small service animations. Each is only created when
  its stage is about to scroll into view, and only runs while it is on screen.
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

### Built in

- **Accessibility**: real headings and landmarks, visible focus styles, a skip link, labelled
  form fields with inline errors, and support for the device's "reduce motion" setting.
  With it on, nothing travels across the screen: the intro and the headlines fade instead
  of sliding, the wall of work stands still (it can still be turned by hand), the glow
  holds one frame, the marquee stops and the demos show their finished state. If the site
  looks static on your own device, check that setting first.
- **Without JavaScript** the page still shows all of its content.
- **SEO**: metadata, Open Graph image, structured data (`ProfessionalService`), sitemap,
  robots and a web manifest are generated from `src/lib/site.ts`.

`AGENTS.md` is written by Next.js for AI coding tools; it is safe to leave as it is.
