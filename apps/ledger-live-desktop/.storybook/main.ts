import type { StorybookConfig } from "@storybook/react-vite";
import { join, dirname, resolve } from "path";
import { mergeConfig } from "vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  viteFinal: async (config, { configType }) => {
    return mergeConfig(config, {
      define: {
        __DEV__: true,
      },
      resolve: {
        alias: {
          [`~/renderer/analytics/segment`]: resolve(".storybook/stub.ts"),
          [`~/renderer/analytics/TrackPage`]: resolve(".storybook/stub.ts"),
          LLD: resolve("./src/newArch"),
          "~": resolve("./src"),

          "../hooks/useDetailedAccounts": resolve(
            "./src/newArch/features/ModularDrawer/components/SelectAccountFlow/hooks/__mocks__/useDetailedAccounts.mock.tsx",
          ), // TODO mock dependencies instead

          "@ledgerhq/live-common/deposit/index": resolve(".storybook/stub.ts"),
          "@ledgerhq/live-common/currencies/index": resolve(".storybook/stub.ts"),
        },
      },
      server: { port: 4400 },
    });
  },
};
export default config;
