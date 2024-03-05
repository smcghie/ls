/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "legasee-images.s3.us-east-2.amazonaws.com",
        },
        {
          protocol: "https",
          hostname: "legasee-avatars.s3.us-east-2.amazonaws.com",
        },
        {
          protocol: "https",
          hostname: "legasee-images-thumbnails.s3.us-east-2.amazonaws.com",
        },
        {
          protocol: "http",
          hostname: "d1mmizwfjbr0sa.cloudfront.net",
        },
        {
          protocol: "https",
          hostname: "d1mmizwfjbr0sa.cloudfront.net",
        },
        {
          protocol: "http",
          hostname: "cdn.legasee.online",
        },
        {
          protocol: "https",
          hostname: "cdn.legasee.online",
        },
        {
          protocol: "http",
          hostname: "legasee.online",
        },
        {
          protocol: "https",
          hostname: "legasee.online",
        },
      ],
      domains: ['cdn.legasee.online', 'legasee.online'],
    },
}

module.exports = nextConfig
