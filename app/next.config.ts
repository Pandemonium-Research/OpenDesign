import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is only used for Docker self-hosting.
  // Vercel manages its own serverless infrastructure, so leave output unset there.
  ...(process.env.BUILD_STANDALONE === '1' && { output: 'standalone' }),
};

export default nextConfig;
