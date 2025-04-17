/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/rank-grants',
        destination: 'https://norooz-backend.fly.dev/rank-grants'
      }
    ]
  }
};

export default nextConfig; 