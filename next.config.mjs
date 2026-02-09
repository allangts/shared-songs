/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar limite de body para uploads de áudio
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
