import { Banner } from "@/components/sections/Banner";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Statement } from "@/components/sections/Statement";
import { Ticker } from "@/components/sections/Ticker";
import { Work } from "@/components/sections/Work";

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        {/* Everything after the hero rides up over it. */}
        <div className="hero-follow relative z-10 rounded-t-[2rem] bg-ink">
          <Ticker />
          <Services />
          <Work />
          <Statement />
          <Process />
          <Banner />
          <Contact />
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
