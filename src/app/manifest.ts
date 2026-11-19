import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}: websites, SEO and social for Australian businesses`,
    short_name: site.name,
    description: site.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
