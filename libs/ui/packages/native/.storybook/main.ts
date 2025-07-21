import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
  stories: [
    "../src/pre-ldls/**/*.stories.@(js|jsx|ts|tsx)",
    "../storybook/stories/**/*.stories.mdx",
    "../storybook/stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-ondevice-controls",
    "@storybook/addon-ondevice-actions",
    "@storybook/addon-ondevice-notes",
    "@storybook/blocks",
  ],
};

export default main;
