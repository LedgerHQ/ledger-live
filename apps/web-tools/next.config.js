/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config, { webpack }) => {
    config.experiments = {
      asyncWebAssembly: true,
    };
    config.resolve.fallback = {
      fs: false,
    };
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^electron$/,
      }),
    );
    return config;
  },
};

module.exports = nextConfig;
