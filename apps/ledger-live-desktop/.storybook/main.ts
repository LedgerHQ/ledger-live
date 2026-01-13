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

const featuresDir = "./src/newArch/features";
const madDir = "./src/newArch/features/ModularDialog";
const aaDir = "./src/newArch/features/AddAccountDrawer";
const detailedAccountsMockDir = `${featuresDir}/__mocks__/accounts.mock.ts`;
const bridge = `${aaDir}/__mocks__/bridge.mock.tsx`;
const selectAssetFlowHookMockDir = `${featuresDir}/__mocks__/useSelectAssetFlow.mock.ts`;
const useConnectAppAction = `${madDir}/__mocks__/useConnectAppAction.mock.ts`;

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../src/renderer"],
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
        global: "globalThis",
        require: `(function(id) {
          if (id === 'https') {
            return { Agent: function() { return {}; } };
          }
          throw new Error('Module not found: ' + id);
        })`,
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          [`~/renderer/analytics/segment`]: resolve(
            "./src/renderer/analytics/__mocks__/segment.ts",
          ),
          [`~/renderer/analytics/TrackPage`]: resolve(".storybook/stub.ts"),
          "@ledgerhq/live-common/e2e/speculosAppVersion": resolve(".storybook/stub.ts"),
          LLD: resolve("./src/newArch"),

          "@ledgerhq/live-common/wallet-api/react": resolve(detailedAccountsMockDir),
          "@ledgerhq/live-countervalues/portfolio": resolve(detailedAccountsMockDir),
          "@ledgerhq/live-countervalues-react": resolve(detailedAccountsMockDir),
          "~/renderer/reducers/accounts": resolve(detailedAccountsMockDir),
          "~/renderer/reducers/settings": resolve(detailedAccountsMockDir),

          "@ledgerhq/live-common/deposit/type": resolve(selectAssetFlowHookMockDir),
          "@ledgerhq/live-common/currencies/index": resolve(selectAssetFlowHookMockDir),

          "~/renderer/bridge/cache": resolve(bridge),
          "@ledgerhq/live-common/bridge/index": resolve(bridge),
          "~/renderer/components/DeviceAction/rendering": resolve(bridge),
          "~/renderer/components/DeviceAction": resolve(bridge),

          "~/renderer/hooks/useConnectAppAction": resolve(useConnectAppAction),

          "~/renderer/families": resolve(detailedAccountsMockDir),
          "@ledgerhq/live-common/account/index": resolve(detailedAccountsMockDir),
          "~/renderer/linking": resolve(detailedAccountsMockDir),

          "~": resolve("./src"),
          https: false,
        },
      },
      server: { port: 4400 },
      optimizeDeps: {
        include: ["buffer"],
        exclude: ["@ledgerhq/live-network"],
      },
    });
  },
};
export default config;
