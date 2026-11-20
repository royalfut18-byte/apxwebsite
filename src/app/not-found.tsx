import type { Metadata } from "next";

import { Aurora } from "@/components/Aurora";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Off the map",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-[100svh] items-center overflow-hidden">
      <Aurora className="absolute inset-0" seed={6} focus={[0.78, 0.6]} reach={[0.62, 0.7]} gain={0.85} />
      <div aria-hidden="true" className="grain absolute inset-0" />

      <div className="shell relative">
        <p className="label flex items-center gap-3 text-mute">
          <span className="text-ember">404</span>
          <span className="h-px w-8 bg-white/20" />
          Page not found
        </p>
        <h1 className="display mt-6 text-[clamp(3.15rem,10vw,10rem)] text-bone">
          Off the <span className="accent">map.</span>
        </h1>
        <p className="mt-7 max-w-md text-lg leading-relaxed text-bone-dim">
          There&rsquo;s nothing at this address. The page may have moved, or the link might be wrong.
        </p>
        <div className="mt-10">
          <Button href="/">Back to the home page</Button>
        </div>
      </div>
    </main>
  );
}
