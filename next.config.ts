import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
