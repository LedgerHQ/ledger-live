/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { fs: false };
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^electron$/,
      }),
    );
    return config;
  },
};

module.exports = nextConfig;
