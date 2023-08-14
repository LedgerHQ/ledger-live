module.exports = {
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: false, // FIXME: this is disabled for now due to incompatibilities with TS 5. re-enable when upgrading storybook.
  },
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    // Fixme: This addon break the usage of useState in the stories https://github.com/chromaui/storybook-addon-pseudo-states/issues/3
    // "storybook-addon-pseudo-states",
  ],
};
