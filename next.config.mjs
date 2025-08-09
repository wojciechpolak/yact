/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
  },
};

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
export default async () => {
  if (process.env.NODE_ENV === 'production') {
    const withSerwist = (await import('@serwist/next')).default({
      cacheOnNavigation: true,
      swSrc: 'src/app/sw.ts',
      swDest: 'public/sw.js',
    });
    return withSerwist(nextConfig);
  }
  return nextConfig;
};
