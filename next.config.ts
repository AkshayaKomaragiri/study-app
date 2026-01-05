/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Match all API requests
        destination: 'http://localhost:3000/api/:path*' // Proxy to Express
      }
    ];
  }
};

module.exports = nextConfig;