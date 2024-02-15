import { dirname, join } from "path";
module.exports = {
  typescript: {
    reactDocgen: true,
  },

  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../src'],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/blocks"
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {
    }
  },

  docs: {
    autodocs: true
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
