type Bucket = { n: number; reset: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 5;
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 200) return;
  for (const [k, v] of buckets) {
    if (v.reset < now) buckets.delete(k);
  }
}

export function clientIp(req: { headers: Headers }) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitTake(key: string) {
  const now = Date.now();
  prune(now);
  const cur = buckets.get(key);
  if (!cur || cur.reset < now) {
    buckets.set(key, { n: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: MAX_HITS - 1, retryAfter: 0 };
  }
  if (cur.n >= MAX_HITS) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((cur.reset - now) / 1000) };
  }
  cur.n += 1;
  return { ok: true, remaining: MAX_HITS - cur.n, retryAfter: 0 };
}

export function rateLimitClear(key: string) {
  buckets.delete(key);
}
