/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Vercel deployment
  output: 'export',
  // Base path if your app is not deployed at the root of the domain
  // basePath: process.env.NODE_ENV === 'production' ? '/frontend' : '',
  // Enable React Strict Mode
  reactStrictMode: true,
  // Enable static exports
  images: {
    unoptimized: true, // Required for static exports
  },
};

export default nextConfig;
