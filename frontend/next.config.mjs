/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // For static exports
  images: {
    unoptimized: true,  // Required for static exports
  },
};

export default nextConfig;