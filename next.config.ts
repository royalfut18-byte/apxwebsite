import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // WebP only. AVIF files are a little smaller but several times slower to decode, and the
    // portfolio captures are long images that are decoded while the visitor is scrolling.
    formats: ["image/webp"],
    // The widest image on the site is drawn about 930 CSS pixels across, so nothing
    // larger than this is ever generated or downloaded, even on very dense screens.
    deviceSizes: [640, 750, 828, 1080, 1200, 1440],
    // 75 for general use, 90 for the portfolio captures where small UI text must stay crisp.
    qualities: [75, 90],
  },
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The site uses none of these, so no script on it may ask for them.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
