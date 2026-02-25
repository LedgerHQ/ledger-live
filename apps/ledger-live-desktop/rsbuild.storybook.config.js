const { defineConfig } = require("@rsbuild/core");
const { pluginReact } = require("@rsbuild/plugin-react");
const { pluginNodePolyfill } = require("@rsbuild/plugin-node-polyfill");
const { resolve, dirname } = require("path");
const { realpathSync } = require("fs");
const { NormalModuleReplacementPlugin } = require("@rspack/core");

const featuresDir = resolve(__dirname, "src/mvvm/features");
const aaDir = resolve(__dirname, "src/mvvm/features/AddAccountDrawer");
const detailedAccountsMockDir = resolve(featuresDir, "__mocks__/accounts.mock.ts");
const settingsMockDir = resolve(__dirname, ".storybook/settingsMock.ts");
const bridge = resolve(aaDir, "__mocks__/bridge.mock.tsx");
const selectAssetFlowHookMockDir = resolve(featuresDir, "__mocks__/useSelectAssetFlow.mock.ts");

const storybookPackageDir = dirname(dirname(realpathSync(require.resolve("@storybook/react"))));
const storybookPreviewMjs = resolve(storybookPackageDir, "dist/entry-preview.mjs");
const storybookPreviewDocsMjs = resolve(storybookPackageDir, "dist/entry-preview-docs.mjs");
const storybookPreviewJs = resolve(storybookPackageDir, "dist/entry-preview.js");
const storybookPreviewDocsJs = resolve(storybookPackageDir, "dist/entry-preview-docs.js");

module.exports = defineConfig({
  plugins: [pluginReact({ fastRefresh: false }), pluginNodePolyfill()],
  server: { port: 4400 },
  source: {
    include: [/.*/],
    define: {
      __DEV__: JSON.stringify(true),
      global: "globalThis",
      __SENTRY_URL__: JSON.stringify(null),
    },
  },
  resolve: {
    alias: {
      react: require.resolve("react"),
      "react-dom": require.resolve("react-dom"),
      "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime"),
      electron: resolve(__dirname, ".storybook/electronStub.js"),
      fs: resolve(__dirname, ".storybook/fsStub.js"),
      "fs/promises": resolve(__dirname, ".storybook/fsStub.js"),
      "node:fs": resolve(__dirname, ".storybook/fsStub.js"),
      "node:fs/promises": resolve(__dirname, ".storybook/fsStub.js"),
      events: require.resolve("events/"),
      "@vitest/mocker": require.resolve("@vitest/mocker"),
      "@vitest/mocker/browser": require.resolve("@vitest/mocker/browser"),
      [storybookPreviewMjs]: storybookPreviewJs,
      [storybookPreviewDocsMjs]: storybookPreviewDocsJs,
      "~/renderer/analytics/segment": resolve(
        __dirname,
        "src/renderer/analytics/__mocks__/segment.ts",
      ),
      "~/renderer/analytics/TrackPage": resolve(__dirname, ".storybook/stub.ts"),
      "@ledgerhq/live-common/e2e/speculosAppVersion": resolve(__dirname, ".storybook/stub.ts"),
      LLD: resolve(__dirname, "src/mvvm"),

      "@ledgerhq/live-common/wallet-api/react": detailedAccountsMockDir,
      "@ledgerhq/live-countervalues/portfolio": detailedAccountsMockDir,
      "@ledgerhq/live-countervalues-react": detailedAccountsMockDir,
      "~/renderer/reducers/accounts": detailedAccountsMockDir,
      "~/renderer/reducers/settings": settingsMockDir,

      "@ledgerhq/live-common/deposit/type": selectAssetFlowHookMockDir,
      "@ledgerhq/live-common/currencies/index": selectAssetFlowHookMockDir,

      "~/renderer/bridge/cache": bridge,
      "@ledgerhq/live-common/bridge/index": bridge,

      "~/renderer/families": detailedAccountsMockDir,
      "@ledgerhq/live-common/account/index": detailedAccountsMockDir,
      "~/renderer/linking": detailedAccountsMockDir,
      "~": resolve(__dirname, "src"),
    },
  },
  tools: {
    rspack: config => {
      config.module = config.module || { rules: [] };
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.mjs$/,
        type: "javascript/auto",
      });
      if (config.entry && typeof config.entry === "object" && "main" in config.entry) {
        const mainEntry = config.entry.main;
        if (Array.isArray(mainEntry)) {
          mainEntry.push(storybookPreviewMjs, storybookPreviewDocsMjs);
        }
      }
      config.plugins = config.plugins || [];
      config.plugins.push(
        new NormalModuleReplacementPlugin(/entry-preview-docs\.mjs$/, resource => {
          resource.request = resource.request.replace(/\.mjs$/, ".js");
        }),
      );
      config.plugins.push(
        new NormalModuleReplacementPlugin(/entry-preview\.mjs$/, resource => {
          resource.request = resource.request.replace(/\.mjs$/, ".js");
        }),
      );
      config.plugins.push(
        new NormalModuleReplacementPlugin(/reducers[\\/]+accounts$/, resource => {
          resource.request = detailedAccountsMockDir;
        }),
      );
      config.plugins.push(
        new NormalModuleReplacementPlugin(/reducers[\\/]+settings$/, resource => {
          resource.request = settingsMockDir;
        }),
      );
      config.externals = [];
      config.resolve = config.resolve || {};
      config.resolve.modules = [
        resolve(__dirname, "node_modules"),
        resolve(__dirname, "../../node_modules"),
        "node_modules",
      ];
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        electron: resolve(__dirname, ".storybook/electronStub.js"),
        fs: resolve(__dirname, ".storybook/fsStub.js"),
        "fs/promises": resolve(__dirname, ".storybook/fsStub.js"),
        "node:fs": resolve(__dirname, ".storybook/fsStub.js"),
        "node:fs/promises": resolve(__dirname, ".storybook/fsStub.js"),
        events: require.resolve("events/"),
        "@vitest/mocker": require.resolve("@vitest/mocker"),
        "@vitest/mocker/browser": require.resolve("@vitest/mocker/browser"),
      };
    },
  },
});
