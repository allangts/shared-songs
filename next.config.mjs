/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar limite de body para uploads de áudio
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config) => {
    // jsmediatags importa react-native-fs que não existe no browser/node
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-fs': false,
    }
    return config
  },
};

export default nextConfig;
