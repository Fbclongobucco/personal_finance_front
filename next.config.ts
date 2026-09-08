import type { NextConfig } from "next";

// The Java backend has no CORS configuration, so the browser can never call it
// cross-origin directly. Rewriting through the Next.js server keeps every
// request same-origin from the browser's point of view (works in dev and prod).
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://api-personal-finance.fabriciolongobuccodev.com.br";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_API_URL}/:path*` }];
  },
};

export default nextConfig;
