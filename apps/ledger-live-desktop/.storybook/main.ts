import { join, dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../src/renderer"],
  addons: [],
  framework: {
    name: getAbsolutePath("storybook-react-rsbuild"),
    options: {
      builder: {
        rsbuildConfigPath: "./rsbuild.storybook.config.js",
      },
    },
  },
};
export default config;
