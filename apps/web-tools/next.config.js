/** @type {import('next').NextConfig} */

const nextConfig = {
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
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
