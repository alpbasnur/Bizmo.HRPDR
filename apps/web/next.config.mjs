/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ph/ui", "@ph/shared"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
    ],
  },
};

export default nextConfig;
