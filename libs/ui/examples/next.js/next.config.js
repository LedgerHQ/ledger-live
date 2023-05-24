/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // see https://styled-components.com/docs/tooling#babel-plugin for more info on the options.
    styledComponents: { ssr: true },
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.woff2$/i,
        type: "asset/resource",
        generator: {
          filename: "../public/fonts/[name][ext][query]",
        },
      });
    }
    return config;
  },
};

module.exports = nextConfig;
