module.exports = {
  stories: [
    "../storybook/stories/**/*.stories.mdx",
    "../storybook/stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-knobs",
    "@storybook/addon-links",
    "@storybook/addon-actions",
    "@storybook/addon-viewport",
    {
      name: "@storybook/addon-docs",
      options: {
        configureJSX: true,
        babelOptions: {},
        sourceLoaderOptions: {
          injectDecorator: false,
        },
        transcludeMarkdown: true,
      },
    },
    "@storybook/addon-controls",
    "@storybook/addon-backgrounds",
    "@storybook/addon-toolbars",
    "@storybook/addon-measure",
    "@storybook/addon-outline",
  ],
};
