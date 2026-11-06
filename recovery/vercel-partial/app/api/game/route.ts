// Vercel hosts the game UI; the existing authoritative room service retains D1 storage.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const backend = 'https://boomgrid-naveen.ampleclove8192.chatgpt.site';
const json = (error: string, status: number) => Response.json({error}, {status, headers: {'Cache-Control': 'no-store'}});
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json('This request must come from BoomGrid.', 403);
  const token = request.headers.get('x-seat-token') || '';
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return json('Your browser seat is missing. Reload to reconnect.', 401);
  const body = await request.text();
  if (body.length > 8000) return json('Request too large.', 413);
  try {
    const response = await fetch(`${backend}/api/game`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-seat-token': token, origin: backend},
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
    });
  } catch {
    return json('The game service is temporarily unavailable. Please try again.', 503);
  }
}
