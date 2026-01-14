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
    externals: {
      // Externalize Concordium SDK and its dependencies for Node.js runtime loading
      "@concordium/web-sdk": "commonjs2 @concordium/web-sdk",
      "@concordium/web-sdk/nodejs": "commonjs2 @concordium/web-sdk/nodejs",
      "@concordium/web-sdk/plt": "commonjs2 @concordium/web-sdk/plt",
      "@protobuf-ts/runtime": "commonjs2 @protobuf-ts/runtime",
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
