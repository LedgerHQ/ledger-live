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

const madDir = "./src/newArch/features/ModularDrawer";
const detailedAccountsMockDir = `${madDir}/components/SelectAccountFlow/hooks/__mocks__/useDetailedAccounts.mock.ts`;
const selectAssetFlowHookMockDir = `${madDir}/components/SelectAssetFlow/__mocks__/useSelectAssetFlow.mock.ts`;

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
          [`~/renderer/analytics/segment`]: resolve(
            "./src/renderer/analytics/__mocks__/segment.ts",
          ),
          [`~/renderer/analytics/TrackPage`]: resolve(".storybook/stub.ts"),
          LLD: resolve("./src/newArch"),

          "@ledgerhq/live-common/wallet-api/react": resolve(detailedAccountsMockDir),
          "@ledgerhq/live-countervalues/portfolio": resolve(detailedAccountsMockDir),
          "@ledgerhq/live-countervalues-react": resolve(detailedAccountsMockDir),
          "~/renderer/components/PerCurrencySelectAccount/state": resolve(detailedAccountsMockDir),
          "~/renderer/reducers/accounts": resolve(detailedAccountsMockDir),
          "~/renderer/reducers/settings": resolve(detailedAccountsMockDir),

          "@ledgerhq/live-common/deposit/index": resolve(selectAssetFlowHookMockDir),
          "@ledgerhq/live-common/currencies/index": resolve(selectAssetFlowHookMockDir),

          "~": resolve("./src"),
        },
      },
      server: { port: 4400 },
    });
  },
};
export default config;
