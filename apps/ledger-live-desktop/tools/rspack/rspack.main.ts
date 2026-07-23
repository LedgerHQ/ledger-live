import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { DatadogWebpackPlugin } from "@datadog/electron-sdk/webpack-plugin";
import { commonConfig, rootFolder, outputFolder } from "./rspack.common";
import {
  buildMainEnv,
  buildDotEnvDefine,
  DOTENV_FILE,
  getRsdoctorPlugin,
  isRsdoctorEnabled,
} from "./utils";

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
      mainFields: ["main", "module"],
    },
    // @datadog/electron-sdk ships dd-trace + WASM files that cannot be bundled by Rspack.
    // DatadogWebpackPlugin copies the runtime tree into .webpack/node_modules; we just need
    // to tell Rspack to leave the require() as-is so it resolves at runtime.
    externals: {
      "@datadog/electron-sdk": "commonjs @datadog/electron-sdk",
      "@datadog/electron-sdk/instrument": "commonjs @datadog/electron-sdk/instrument",
    },
    plugins: [
      new DatadogWebpackPlugin(),
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
