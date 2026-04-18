import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  proxyClientMaxBodySize: 50 * 1024 * 1024,
};

export default nextConfig;
