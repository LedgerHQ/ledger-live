import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE } from "./utils";

/**
 * Creates the rspack configuration for the Electron preloader script
 */
export function createPreloaderConfig(
  mode: "development" | "production",
  argv?: { port?: number },
): RspackOptions {
  const isDev = mode === "development";

  return {
    ...commonConfig,
    name: "preloader",
    mode,
    target: "electron-preload",
    entry: {
      preloader: path.resolve(rootFolder, "src", "preloader", "index.ts"),
    },
    output: {
      ...commonConfig.output,
      filename: "preloader.bundle.js",
      library: {
        type: "commonjs2",
      },
    },
    resolve: {
      ...commonConfig.resolve,
      // Help rspack find modules in pnpm's node_modules structure
      modules: [
        path.resolve(rootFolder, "node_modules"),
        path.resolve(rootFolder, "..", "..", "node_modules"),
        "node_modules",
      ],
      symlinks: true,
      alias: {
        ...commonConfig.resolve?.alias,
        // Help rspack resolve @protobuf-ts/runtime from desktop's node_modules
        // This is needed because pnpm's strict dependency isolation prevents
        // rspack from resolving transitive dependencies within @concordium/web-sdk
        "@protobuf-ts/runtime": path.resolve(rootFolder, "node_modules", "@protobuf-ts", "runtime"),
      },
    },
    devtool: "source-map",
    plugins: [
      new rspack.DefinePlugin({
        ...buildMainEnv(mode, argv),
        ...buildDotEnvDefine(DOTENV_FILE),
      }),
    ],
    optimization: {
      minimize: !isDev,
    },
    stats: "errors-warnings",
  };
}

export default createPreloaderConfig;
