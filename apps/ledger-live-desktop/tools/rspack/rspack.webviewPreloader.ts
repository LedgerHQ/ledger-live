import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE, getRsdoctorPlugin } from "./utils";

/**
 * Creates the rspack configuration for the webview preloader script
 */
export function createWebviewPreloaderConfig(
  mode: "development" | "production",
  argv?: { port?: number },
): RspackOptions {
  const isDev = mode === "development";

  return {
    ...commonConfig,
    name: "webviewPreloader",
    mode,
    target: "electron-preload",
    entry: {
      webviewPreloader: path.resolve(rootFolder, "src", "webviewPreloader", "index.ts"),
    },
    output: {
      ...commonConfig.output,
      filename: "webviewPreloader.bundle.js",
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

export default createWebviewPreloaderConfig;
