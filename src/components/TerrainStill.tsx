import Image from "next/image";

import mapTall from "@/assets/terrain/map-tall.webp";
import mapWide from "@/assets/terrain/map-wide.webp";
import peakTall from "@/assets/terrain/peak-tall.webp";
import peakWide from "@/assets/terrain/peak-wide.webp";
import { cn } from "@/lib/cn";

// `focus` keeps the summit in frame when the picture is cropped to fit the screen.
const STILLS = {
  peak: {
    wide: { src: peakWide, focus: "object-[70%_30%]" },
    tall: { src: peakTall, focus: "object-[50%_15%]" },
  },
  map: {
    wide: { src: mapWide, focus: "object-[25%_45%]" },
    tall: { src: mapTall, focus: "object-[50%_25%]" },
  },
};

/**
 * A picture of the mountain, taken from the live scene, for browsers that cannot draw it
 * (no WebGL2, or no graphics hardware to run it on: see Terrain.tsx). It comes in the same
 * two framings the scene uses, one for wide screens and one for tall ones. Only the one
 * on show is ever downloaded, and neither is downloaded at all where the live scene runs.
 */
export function TerrainStill({ view, className }: { view: "peak" | "map"; className?: string }) {
  const still = STILLS[view];
  return (
    <div aria-hidden="true" className={cn("overflow-hidden", className)}>
      <Image
        src={still.wide.src}
        alt=""
        fill
        sizes="100vw"
        quality={90}
        className={cn("object-cover [@media(max-aspect-ratio:9/10)]:hidden", still.wide.focus)}
      />
      <Image
        src={still.tall.src}
        alt=""
        fill
        sizes="100vw"
        quality={90}
        className={cn("hidden object-cover [@media(max-aspect-ratio:9/10)]:block", still.tall.focus)}
      />
    </div>
  );
}
