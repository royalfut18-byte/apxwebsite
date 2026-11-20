import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Serif, Mona_Sans } from "next/font/google";

import { Cursor } from "@/components/Cursor";
import { Intro } from "@/components/Intro";
import { Nav } from "@/components/Nav";
import { IntroProvider } from "@/components/providers/IntroProvider";
import { services, site } from "@/lib/site";

import "./globals.css";

const mona = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const title = `${site.name} | Web Design, SEO & Social Media for Australian Businesses`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "web design Australia",
    "website design for small business",
    "local SEO",
    "SEO agency Australia",
    "Instagram management",
    "social media management",
    "custom business software",
    "SMS sender",
    "APX",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: site.url,
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070708",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${site.url}/#business`,
      name: site.name,
      url: site.url,
      description: site.description,
      email: site.email,
      ...(site.phone ? { telephone: site.phone } : {}),
      areaServed: { "@type": "Country", name: "Australia" },
      ...(site.instagram ? { sameAs: [`https://www.instagram.com/${site.instagram}`] } : {}),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: services.map((service) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: service.title, description: service.body },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.shortDescription,
      inLanguage: "en-AU",
      publisher: { "@id": `${site.url}/#business` },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      data-scroll-behavior="smooth"
      className={`${mona.variable} ${instrument.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {/* Without scripts there is no intro and nothing animates in, so show everything as-is. */}
        <noscript>
          <style>{`.intro-root,.wall-caption{display:none!important}:root{--hero-screens:2!important}[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}[data-draw] path{stroke-dasharray:none!important;stroke-dashoffset:0!important;opacity:1!important}`}</style>
        </noscript>

        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-bone px-5 py-3 text-sm font-semibold text-ink transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>

        <IntroProvider>
          <Intro />
          <Nav />
          <Cursor />
          {children}
        </IntroProvider>
      </body>
    </html>
  );
}
