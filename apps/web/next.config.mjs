/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ph/ui", "@ph/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
