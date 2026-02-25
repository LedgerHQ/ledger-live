import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const config = {
  typescript: {
    reactDocgen: true,
  },

  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../src"],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-docs"),
  ],

  framework: {
    name: getAbsolutePath("storybook-react-rsbuild"),
    options: {},
  },

  docs: {
    autodocs: true,
  },
};
export default config;

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
