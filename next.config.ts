// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don’t block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t block production builds on TS errors
    ignoreBuildErrors: true,
  },
  // optional: if you use next/image with external hosts, add domains here
  // images: { domains: ["your-cdn.com"] },
};

export default nextConfig;
