import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE, getRsdoctorPlugin } from "./utils";

/**
 * Creates the rspack configuration for the webview DApp preloader script
 */
export function createWebviewDappPreloaderConfig(
  mode: "development" | "production",
  argv?: { port?: number },
): RspackOptions {
  const isDev = mode === "development";

  return {
    ...commonConfig,
    name: "webviewDappPreloader",
    mode,
    target: "electron-preload",
    entry: {
      webviewDappPreloader: path.resolve(rootFolder, "src", "webviewPreloader", "dappPreloader.ts"),
    },
    output: {
      ...commonConfig.output,
      filename: "webviewDappPreloader.bundle.js",
      library: {
        type: "commonjs2",
      },
    },
    devtool: "source-map",
    plugins: [
      ...getRsdoctorPlugin(),
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

export default createWebviewDappPreloaderConfig;
