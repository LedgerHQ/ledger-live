import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE } from "./utils";

/**
 * Creates the rspack configuration for the ZCash UtilityProcess bundle.
 *
 * Spawned by Electron main via `utilityProcess.fork(.webpack/zcash-utility.bundle.js)`
 * to host the napi-rs `.node` addon outside the renderer.
 *
 * Target is `node` rather than `electron-main`: UtilityProcesses run in a
 * plain Node context (no Electron APIs beyond `process.parentPort`).
 *
 * `@ledgerhq/zcash-utils` stays external — `.node` addons cannot be bundled,
 * they must be loaded via `require()` at runtime from the LLD `node_modules`.
 */
export function createZcashUtilityConfig(
  mode: "development" | "production",
  argv?: { port?: number },
): RspackOptions {
  const isDev = mode === "development";

  return {
    ...commonConfig,
    name: "zcashUtility",
    mode,
    target: "node",
    entry: {
      zcashUtility: path.resolve(
        rootFolder,
        "../../libs/coin-modules/zcash-shielded/src/ipc/utility-entry.ts",
      ),
    },
    output: {
      ...commonConfig.output,
      filename: "zcash-utility.bundle.js",
      library: {
        type: "commonjs2",
      },
    },
    devtool: "source-map",
    externals: {
      // .node addons cannot be bundled; loaded at runtime via require()
      "@ledgerhq/zcash-utils": "commonjs @ledgerhq/zcash-utils",
    },
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

export default createZcashUtilityConfig;
