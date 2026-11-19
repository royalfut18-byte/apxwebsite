# APX

The website for APX: websites, SEO, Instagram and custom tools for Australian businesses.

One long page, built to show the kind of work APX does: a Framer Motion intro, a live 3D
contour-line mountain behind the hero, animated demos of each service, and a portfolio of
real, live client sites.

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

1. Capture the client's site: a desktop screenshot about 2160px wide and a mobile one about
   780px wide. Tall captures work best, because the card scrolls through them.
2. Save both as `.webp` in `src/assets/work/`.
3. Add an entry to `src/lib/projects.ts`, following the existing ones. `theme` sets the card's
   colours; take them from the client's own brand.

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

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**, **Framer Motion**, and
  **Lenis** for smooth scrolling.
- `src/components/Intro.tsx`: the opening sequence. The wordmark shares a `layoutId` with
  the header logo, which is how it flies into place. Repeat visits in the same tab get a
  shorter version.
- `src/components/Terrain.tsx`: the mountain. Raw WebGL2, one mesh and one shader, no 3D
  library. It pauses when off screen and lowers its own resolution on slow graphics
  hardware. If WebGL is unavailable the hero keeps its glow and simply leaves the mountain
  out.
- `src/components/demos/`: the four small service animations.
- `src/components/sections/`: one file per section of the page.

### Built in

- **Accessibility**: real headings and landmarks, visible focus styles, a skip link, labelled
  form fields with inline errors, and support for "reduce motion" (no intro, no parallax,
  a still mountain, finished demo states).
- **Without JavaScript** the page still shows all of its content.
- **SEO**: metadata, Open Graph image, structured data (`ProfessionalService`), sitemap,
  robots and a web manifest are generated from `src/lib/site.ts`.

`AGENTS.md` is written by Next.js for AI coding tools; it is safe to leave as it is.
