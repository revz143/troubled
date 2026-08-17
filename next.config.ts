import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  distDir: process.env.HINGA_E2E_DIST_DIR === "1" ? ".next-e2e" : ".next",
};

export default nextConfig;
