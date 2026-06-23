/**
 * Allowed browser origins from CLIENT_URLS (comma-separated).
 * Vercel preview/production URLs ending in .vercel.app are always allowed.
 */
export function getAllowedOrigins() {
  const raw =
    process.env.CLIENT_URLS ||
    "http://localhost:5173,http://localhost:5174,http://localhost:5175";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (getAllowedOrigins().includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}
