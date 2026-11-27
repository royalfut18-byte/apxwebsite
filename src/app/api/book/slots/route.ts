import { connection } from "next/server";

import { fetchFreeTimes } from "@/lib/calls";

/**
 * The free call times for the booking page. They come from APECS, a long way round (another
 * server and its database), so Vercel keeps a copy at its edge, close to the visitor: fresh
 * for a minute, then served straight away while a new copy is fetched in the background (for
 * up to a day). So the calendar shows at once. A time booked in the meantime is turned down
 * by APECS when someone picks it (the page then says so and drops it), and the page hides
 * any time that's become less than an hour away.
 *
 * 503, never kept, when online booking isn't set up or can't be reached: the page then
 * offers email instead.
 */
const KEEP_AT_EDGE = {
  // Browsers always ask again (they'd otherwise keep their own copy for the day, too)...
  "Cache-Control": "no-cache",
  // ...and it's Vercel's edge that answers them, from its copy.
  "Vercel-CDN-Cache-Control": "max-age=60, stale-while-revalidate=86400",
};

export async function GET() {
  await connection();
  const free = await fetchFreeTimes();
  if (!free) {
    return Response.json(
      { error: "Online booking isn't available right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(free, { headers: KEEP_AT_EDGE });
}
