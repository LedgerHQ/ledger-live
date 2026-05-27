import { featureFlags, type FeatureFlagsToolProps } from "./metadata/team-platform/feature-flags";

export * from "./types";

export const tools = {
  "feature-flags": featureFlags,
} as const;

/**
 * Host-supplied configuration passed to the DevTools shell.
 *
 * One entry per tool the host wants to enable, in the order they should appear.
 */
export type DevToolsConfig = Array<DevToolConfig>;

/**
 * Union of every registered tool's `{ id, config }` pair.
 *
 * Each member ties a tool id to the exact props that tool expects, so the
 * host gets type-checked configuration per tool.
 *
 * For propless tools, `config` must be `undefined` — e.g. `{ id: "dummy", config: undefined }`.
 */
export type DevToolConfig = { id: "feature-flags"; config: FeatureFlagsToolProps };
