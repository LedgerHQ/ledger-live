import path from "path";
import { createRequire } from "module";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder, outputFolder } from "./rspack.common.mts";
import {
  buildMainEnv,
  buildDotEnvDefine,
  DOTENV_FILE,
  getRsdoctorPlugin,
  isRsdoctorEnabled,
} from "./utils.mts";

/**
 * Creates the rspack configuration for the Electron main process
 */
export function createMainConfig(
  mode: "development" | "production",
  argv?: { port?: number },
): RspackOptions {
  const isDev = mode === "development";

  return {
    ...commonConfig,
    name: "main",
    mode,
    target: "electron-main",
    entry: {
      main: path.resolve(rootFolder, "src", "index.ts"),
    },
    output: {
      ...commonConfig.output,
      filename: "main.bundle.js",
      library: {
        type: "commonjs2",
      },
    },
    devtool: isRsdoctorEnabled() ? false : "source-map",
    resolve: {
      ...commonConfig.resolve,
      // Before "~": the shared Datadog modules read their bootstrap from Electron in main.
      alias: {
        "~/renderer/bridge$": path.resolve(rootFolder, "src", "main", "rendererBridge.ts"),
        // The SDK's CommonJS build: its ESM one makes rspack chase a WASM file it inlines anyway.
        "@datadog/electron-sdk$": createRequire(import.meta.url).resolve("@datadog/electron-sdk"),
        // The SDK runs without its tracer, which main turns off anyway (no trace headers).
        "dd-trace": false,
        ...commonConfig.resolve?.alias,
      },
      mainFields: ["main", "module"],
    },
    plugins: [
      ...getRsdoctorPlugin("main"),
      new rspack.DefinePlugin({
        ...buildMainEnv(mode, argv),
        ...buildDotEnvDefine(DOTENV_FILE),
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: path.join(rootFolder, "build", "icons"),
            to: path.join(outputFolder, "build", "icons"),
          },
        ],
      }),
    ],
    optimization: {
      minimize: !isDev,
    },
    stats: "errors-warnings",
  };
}

export default createMainConfig;
