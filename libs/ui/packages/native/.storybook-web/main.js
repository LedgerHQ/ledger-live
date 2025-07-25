import { dirname, join } from "path";
module.exports = {
  stories: [
    "../src/pre-ldls/**/*.stories.@(js|jsx|ts|tsx)",
    "../storybook/stories/**/*.mdx",
    "../storybook/stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-react-native-web"),
    getAbsolutePath("@storybook/blocks"),
    getAbsolutePath("storybook-dark-mode"),
    getAbsolutePath("@storybook/addon-interactions"),
    {
      name: "@storybook/addon-react-native-web",
      options: {
        modulesToTranspile: ["react-native-reanimated"],
        babelPlugins: [
          "@babel/plugin-transform-export-namespace-from",
          "react-native-reanimated/plugin",
        ],
      },
    },
  ],

  typescript: {
    reactDocgen: true,
  },

  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {},
  },

  docs: {
    autodocs: true,
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
