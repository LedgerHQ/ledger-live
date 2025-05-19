import type { StorybookConfig } from "@storybook/react-vite";
import { join, dirname, resolve } from "path";
import { mergeConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["./public"],

  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  viteFinal: async config => {
    console.log(config);
    return mergeConfig(config, {
      define: {
        __DEV__: true,
      },
      resolve: {
        alias: {
          qs: require.resolve("qs"),

          // Explicitly alias the 'buffer' module to the installed 'buffer' package
          "buffer/": "buffer/", // Alias 'buffer/' imports
          buffer: "buffer", // Alias 'buffer' imports

          fs: resolve(".storybook/__mocks__/modules/fs.ts"),

          electron: resolve(".storybook/__mocks__/modules/electron.ts"),
          "electron-store": resolve(".storybook/__mocks__/modules/electron-store.ts"),

          "@braze/web-sdk": resolve(".storybook/__mocks__/modules/braze.ts"),
          "@braze/web-sdk/src/InAppMessage/models/html-message.js": resolve(
            ".storybook/__mocks__/modules/_null.ts",
          ),

          LLD: resolve("./src/newArch"),
          "~": resolve("./src"),
        },
      },
      server: { port: 4400 },

      plugins: [
        nodePolyfills({
          exclude: ["fs"],
          globals: { Buffer: true, process: true },
          protocolImports: true,
        }),
      ],
    });
  },
};
export default config;
