const isStaticExport = process.env.YACT_STATIC_EXPORT === '1';
const basePath = process.env.YACT_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: isStaticExport
    ? {
        unoptimized: true,
      }
    : undefined,
  output: isStaticExport ? 'export' : 'standalone',
  trailingSlash: isStaticExport,
};

export default nextConfig;
