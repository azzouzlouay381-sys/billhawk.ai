/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required to allow large file uploads through the API route
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
