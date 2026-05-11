import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb"
    }
  },
  images: {
    remotePatterns: [
      {
        hostname: "rvcpiccqcjvtdaotevaf.supabase.co",
        protocol: "https"
      }
    ]
  },
  turbopack: {
    root: repoRoot
  }
};

export default nextConfig;
