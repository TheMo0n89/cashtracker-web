import type { NextConfig } from "next";

/**
 * Resolves the backend base URL from environment variables.
 *
 * Handles the case where NEXT_PUBLIC_API_URL is configured without a protocol
 * (e.g. "cashtracker-api-mggy.onrender.com/v1" instead of
 * "https://cashtracker-api-mggy.onrender.com/v1") — a common mistake when
 * setting environment variables in Vercel Dashboard.
 *
 * Without this guard, Next.js rejects the rewrite at build time with:
 *   "destination does not start with /, http://, or https://"
 */
function resolveBackendUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_SERVER_API_URL ||
    "http://localhost:3001"
  ).trim();

  // Strip trailing /v1 segment so the rewrite can append it dynamically
  const base = raw
    .replace(/\/v1\/?$/, "")
    .replace(/\/+$/, "");

  // Auto-prepend https:// when the protocol is missing
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    console.warn(
      `[next.config] NEXT_PUBLIC_API_URL is missing a protocol prefix. ` +
      `Got: "${base}" — auto-correcting to "https://${base}". ` +
      `Fix this in your Vercel environment variables.`
    );
    return `https://${base}`;
  }

  return base;
}

const backendUrl = resolveBackendUrl();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

