import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Merges the per-package configs of one platform (all built by createDualPlatformKnipConfig)
// into one config, so one knip run covers every dual-platform package of that platform.
export default async () => {
  const configPaths = process.env.KNIP_STUDY_CONFIGS.split(",");
  const configs = await Promise.all(
    configPaths.map(async path => (await import(pathToFileURL(resolve(path)).href)).default),
  );
  return {
    ...configs[0],
    workspaces: Object.assign({}, ...configs.map(config => config.workspaces)),
  };
};
