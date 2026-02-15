import path from "path";
import fs from "fs";
import { rspack, type RspackOptions } from "@rspack/core";
import { commonConfig, rootFolder } from "./rspack.common";
import { buildRendererEnv, buildDotEnvDefine, DOTENV_FILE, getRsdoctorPlugin } from "./utils";

const workersPath = path.join(rootFolder, "src", "renderer", "webworkers", "workers");

/**
 * Gets all worker entry files from the workers directory
 */
export function getWorkerEntries(): Record<string, string> {
  const entries: Record<string, string> = {};

  if (fs.existsSync(workersPath)) {
    const files = fs.readdirSync(workersPath);
    files.forEach(file => {
      const name = file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
      entries[`${name}.worker`] = path.join(workersPath, file);
    });
  }

  return entries;
}

/**
 * Creates the rspack configuration for web workers
 */
export function createWorkerConfig(mode: "development" | "production"): RspackOptions {
  const isDev = mode === "development";
  const entries = getWorkerEntries();

  // If no workers, return an empty config
  if (Object.keys(entries).length === 0) {
    return {
      ...commonConfig,
      name: "workers",
      mode,
      entry: {},
    };
  }

  return {
    ...commonConfig,
    name: "workers",
    mode,
    target: "webworker",
    entry: entries,
    output: {
      ...commonConfig.output,
      filename: "[name].js",
    },
    devtool: "source-map",
    plugins: [
      ...getRsdoctorPlugin(),
      new rspack.DefinePlugin({
        ...buildRendererEnv(mode),
        ...buildDotEnvDefine(DOTENV_FILE),
      }),
    ],
    optimization: {
      minimize: !isDev,
    },
    stats: "errors-warnings",
  };
}

export default createWorkerConfig;
