import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder, outputFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE, getRsdoctorPlugin } from "./utils";

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
    devtool: "source-map",
    resolve: {
      ...commonConfig.resolve,
      mainFields: ["main", "module"],
    },
    plugins: [
      ...getRsdoctorPlugin(),
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
