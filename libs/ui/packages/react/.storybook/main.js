import { dirname, join } from "path";
module.exports = {
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: false, // FIXME: this is disabled for now due to incompatibilities with TS 5. re-enable when upgrading storybook.
  },

  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(ts|tsx)"],

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
