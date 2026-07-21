type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

/**
 * Fixed-window rate limiter, keyed by client IP.
 *
 * NOTE: this is per-instance, in-process state. On Vercel each serverless
 * instance keeps its own map, so the effective limit is `MAX_REQUESTS` times
 * the number of warm instances. That is enough to blunt a naive submit loop but
 * is NOT a real control — Phase 7 replaces it with a shared store
 * (Upstash Redis / Vercel KV) so the limit holds across instances.
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP. Vercel sets `x-forwarded-for`. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
