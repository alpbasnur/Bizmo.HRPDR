/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ph/ui", "@ph/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
