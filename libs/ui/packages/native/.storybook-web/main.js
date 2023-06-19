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
  typescript: {
    reactDocgen: false, // FIXME: this is disabled for now due to incompatibilities with TS 5. re-enable when upgrading storybook.
  },
  core: {
    builder: "webpack5",
  },
  framework: "@storybook/react",
};
