import { rspack } from "@rspack/core";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { pluginStyledComponents } from "@rsbuild/plugin-styled-components";

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
      config.resolve.extensions = [
        ".web.tsx",
        ".web.ts",
        ".web.jsx",
        ".web.js",
        ...(config.resolve.extensions ?? []),
      ];
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        net: false,
        vm: false,
        tls: false,
        http2: false,
        dns: false,
      };
      // zcash-utils is a native (napi) addon with no browser build, so it can
      // never run on the web. Stub it (and any other native .node binary) so
      // registerAllCoins() can register every family without breaking the web
      // build — zcash account sync is simply unavailable here.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@ledgerhq/zcash-utils": false,
      };
      appendPlugins([
        new rspack.IgnorePlugin({ resourceRegExp: /^electron$/ }),
        new rspack.IgnorePlugin({ resourceRegExp: /\.node$/ }),
      ]);
    },
  },
});
