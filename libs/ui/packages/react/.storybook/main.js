import { dirname, join, resolve } from "path";
module.exports = {
  typescript: {
    reactDocgen: true,
  },

  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../src"],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-rspack"),
    options: {},
  },

  docs: {
    autodocs: true,
  },

  rspackFinal: async config => {
    config.resolve = config.resolve || {};
    config.resolve.extensions = [".ts", ".tsx", ".js", ".json", ".mdx"];
    config.resolve.modules = [resolve(__dirname, "..", "node_modules"), "node_modules"];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      os: require.resolve("os-browserify/browser"),
      tty: require.resolve("tty-browserify"),
    };
    return config;
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
