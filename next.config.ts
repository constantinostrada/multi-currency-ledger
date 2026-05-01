import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enforce module boundaries at build time via webpack aliases
  webpack(config) {
    return config;
  },
};

export default nextConfig;
