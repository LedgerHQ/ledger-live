import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootConfig = require("./knip.json");

/**
 * Creates a Knip configuration for one platform of a dual-platform package.
 *
 * @param {{
 *   packagePath: string;
 *   platform: "native" | "web";
 *   entry: string[];
 *   additionalProjectExcludes?: string[];
 *   additionalIgnoreDependencies?: string[];
 * }} options
 * `additionalProjectExcludes` values must omit the leading `!`.
 * @example
 * createDualPlatformKnipConfig({
 *   packagePath: "features/flow/example",
 *   platform: "web",
 *   entry: ["src/index.ts"],
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
    workspaces: {
      ...rootConfig.workspaces,
      [packagePath]: workspace,
    },
  };
}
