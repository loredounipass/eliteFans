/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Note: Avoid changing webpack.devtool in development mode; Next.js will
  // revert it to avoid severe performance regressions (see Next.js warning).
}

export default nextConfig
