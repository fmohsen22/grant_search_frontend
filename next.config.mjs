/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://norooz-backend.fly.dev/:path*'
      }
    ]
  }
};

export default nextConfig; 