import path from "path";
import fs from "fs";
import { rspack } from "@rspack/core";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { pluginStyledComponents } from "@rsbuild/plugin-styled-components";

const liveCommonRoot = path.resolve(process.cwd(), "node_modules/@ledgerhq/live-common");
const liveCommonResolved = fs.existsSync(liveCommonRoot)
  ? fs.realpathSync(liveCommonRoot)
  : liveCommonRoot;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginNodePolyfill({
      include: [
        "assert",
        "buffer",
        "crypto",
        "events",
        "http",
        "https",
        "path",
        "querystring",
        "stream",
        "string_decoder",
        "url",
        "util",
        "zlib",
      ],
    }),
    pluginStyledComponents(),
  ],
  html: {
    template: "./src/index.html",
  },
  output: {
    assetPrefix: "./",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  server: {
    port: 3000,
  },
  tools: {
    rspack: (config, { appendPlugins }) => {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        vm: false,
        tls: false,
        http2: false,
        dns: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "@ledgerhq/live-common/bridge/generic-alpaca/alpaca": path.join(
          liveCommonResolved,
          "lib-es/bridge/generic-alpaca/alpaca/index.js",
        ),
        "@ledgerhq/live-common/bridge/generic-alpaca/utils": path.join(
          liveCommonResolved,
          "lib-es/bridge/generic-alpaca/utils.js",
        ),
        "@ledgerhq/live-common/bridge/generic-alpaca/buildSubAccounts": path.join(
          liveCommonResolved,
          "lib-es/bridge/generic-alpaca/buildSubAccounts.js",
        ),
      };
      appendPlugins([new rspack.IgnorePlugin({ resourceRegExp: /^electron$/ })]);
    },
  },
});
