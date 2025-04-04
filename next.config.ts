import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Only use standalone output in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
