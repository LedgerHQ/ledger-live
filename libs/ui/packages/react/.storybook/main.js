import { dirname, join } from "path";
module.exports = {
  typescript: {
    reactDocgen: true,
  },

  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(ts|tsx)"],
  staticDirs: ['../src'],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {}
  },

  docs: {
    autodocs: true
  }
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
