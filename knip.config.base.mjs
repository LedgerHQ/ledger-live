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
  // Platform-specific files (*.web.* / *.native.*) are resolved by the bundler
  // through platform resolution (e.g. `import "./component"` → `./component.web.tsx`).
  // Knip can't trace that, so we add them as entry points to avoid false "unused file" reports.
  const platformEntry = platform === "web" ? "src/**/*.web.{ts,tsx}" : "src/**/*.native.{ts,tsx}";
  const workspace = {
    ...rootConfig.workspaces[packagePath],
    entry: [...entry, platformEntry],
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
    ignoreWorkspaces: ["apps/ledger-live-mobile"],
    workspaces: {
      [packagePath]: workspace,
    },
  };
}
