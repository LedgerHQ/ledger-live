const config = {
  stories: [
    "../src/pre-ldls/**/*.stories.@(js|jsx|ts|tsx)",
    "../storybook/stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],

  addons: ["@storybook/addon-links"],

  typescript: {
    reactDocgen: true,
  },

  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },

  docs: {
    autodocs: false,
    disable: true,
  },
};
export default config;
