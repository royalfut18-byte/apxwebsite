import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // 75 for general use, 90 for the portfolio captures where small UI text must stay crisp.
    qualities: [75, 90],
  },
};

export default nextConfig;
