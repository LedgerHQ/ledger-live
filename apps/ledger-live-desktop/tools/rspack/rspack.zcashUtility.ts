import path from "path";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildMainEnv, buildDotEnvDefine, DOTENV_FILE } from "./utils";

/**
 * Creates the rspack configuration for the ZCash UtilityProcess bundle.
 *
 * Spawned by Electron main via `utilityProcess.fork(.webpack/zcash-utility.bundle.js)`
 * to host the napi-rs `.node` addon outside the renderer. The host forks lazily,
 * on the first request, so a session that never touches Zcash never pays for it.
 *
 * The engine is the one of the standalone `coin-zcash` module: the Zcash
 * chain-adapter of `coin-bitcoin` also ships an engine, but only ever reaches it
 * from its shielded path, which the `zcashShielded` feature flag now routes to
 * `coin-zcash` instead — so it is left unbuilt and unhosted.
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
        "../../libs/coin-modules/coin-zcash/src/network/ipc/utility-entry.ts",
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
