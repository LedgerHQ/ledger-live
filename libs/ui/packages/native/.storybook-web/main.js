module.exports = {
  stories: [
    "../storybook/stories/**/*.stories.mdx",
    "../storybook/stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-react-native-web",
  ],
  core: {
    builder: "webpack5",
  },
  framework: "@storybook/react",
};
