import { connection } from "next/server";

import { fetchFreeTimes } from "@/lib/calls";

/**
 * The free call times for the booking page, fresh from APECS on every request (it knows
 * what's already in the calendar). 503 when online booking isn't set up or can't be
 * reached: the page then offers email instead.
 */
export async function GET() {
  await connection();
  const free = await fetchFreeTimes();
  const headers = { "Cache-Control": "no-store" };
  if (!free)
    return Response.json({ error: "Online booking isn't available right now." }, { status: 503, headers });
  return Response.json(free, { headers });
}
