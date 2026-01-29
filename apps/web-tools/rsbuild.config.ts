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
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        vm: false,
        tls: false,
        http2: false,
        dns: false,
      };
      appendPlugins([
        new rspack.IgnorePlugin({ resourceRegExp: /^electron$/ }),
        new rspack.IgnorePlugin({ resourceRegExp: /@grpc\/grpc-js/ }),
        new rspack.IgnorePlugin({ resourceRegExp: /@grpc\/proto-loader/ }),
      ]);
    },
  },
});
