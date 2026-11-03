import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const rootConfig = require("./knip.json");
const repoRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Creates a Knip configuration for one platform of a dual-platform package.
 *
 * Why the split exists, when each option is needed, and the resolution facts behind it:
 * `.agents/skills/knip-migration/SKILL.md`. Consumers of this helper carry no comments of their
 * own, so read that section before adding an option here.
 *
 * @param {{
 *   packagePath: string;
 *   platform: "native" | "web";
 *   entry: string[];
 *   additionalProjectExcludes?: string[];
 *   additionalIgnoreDependencies?: string[];
 * }} options
 * `entry` is `[]` unless `package.json` cannot yield the entry point.
 * `additionalProjectExcludes` values must omit the leading `!`.
 * @example
 * createDualPlatformKnipConfig({
 *   packagePath: "features/flow/example",
 *   platform: "web",
 *   entry: [],
 * });
 */
export function createDualPlatformKnipConfig({
  packagePath,
  platform,
  entry,
  additionalProjectExcludes = [],
  additionalIgnoreDependencies = [],
}) {
  const platformProjectExclude = platform === "web" ? "!src/**/*.native.*" : "!src/**/*.web.*";
  const passThrough = source => source;
  const compilers =
    platform === "web"
      ? { "web.ts": passThrough, "web.tsx": passThrough }
      : { "native.ts": passThrough, "native.tsx": passThrough };
  const workspace = {
    ...rootConfig.workspaces[packagePath],
    entry,
    project: [
      "src/**/*",
      platformProjectExclude,
      ...additionalProjectExcludes.map(pattern => `!${pattern}`),
    ],
  };

  if (additionalIgnoreDependencies.length > 0) {
    workspace.ignoreDependencies = [
      ...(rootConfig.workspaces[packagePath]?.ignoreDependencies ?? []),
      ...additionalIgnoreDependencies,
    ];
  }

  return {
    ...rootConfig,
    compilers,
    ignoreWorkspaces: ["apps/ledger-live-mobile"],
    workspaces: {
      [packagePath]: workspace,
    },
  };
}

/**
 * Creates the Knip configuration that checks one platform of every dual-platform package in a
 * single run from the repo root. It merges the per-package `knip.<platform>.config.mjs` files,
 * which all come from `createDualPlatformKnipConfig` and differ only in `workspaces`.
 *
 * @param {"native" | "web"} platform
 */
export async function createMonorepoPlatformKnipConfig(platform) {
  const configPaths = execFileSync("git", ["ls-files", `*/knip.${platform}.config.mjs`], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  const configs = await Promise.all(
    configPaths.map(
      async path => (await import(pathToFileURL(resolve(repoRoot, path)).href)).default,
    ),
  );
  const workspaces = Object.assign({}, ...configs.map(config => config.workspaces));
  return {
    ...configs[0],
    ignoreWorkspaces: ["**", ...Object.keys(workspaces).map(path => `!${path}`)],
    workspaces,
  };
}
