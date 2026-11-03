import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Merges the per-package configs of one platform into one config, so a single knip run covers
 * every dual-platform package of that platform. All of them come from
 * `createDualPlatformKnipConfig`, so only their `workspaces` differ.
 * `KNIP_COMBINED_CONFIGS` is set by `run-grouped.mjs`.
 */
export default async () => {
  const configPaths = process.env.KNIP_COMBINED_CONFIGS.split(",");
  const configs = await Promise.all(
    configPaths.map(async path => (await import(pathToFileURL(resolve(path)).href)).default),
  );
  return {
    ...configs[0],
    workspaces: Object.assign({}, ...configs.map(config => config.workspaces)),
  };
};
