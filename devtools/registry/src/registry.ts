import * as platform from "./metadata/platform";
import * as walletXp from "./metadata/wallet-xp";

export const tools = {
  "feature-flags": platform.featureFlags,
  env: platform.env,
  "pay-card": walletXp.payCard,
  trustchain: platform.trustchain,
  "cloud-sync": platform.cloudSync,
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
export type DevToolConfig =
  | { id: "feature-flags"; config: platform.FeatureFlagsToolProps }
  | { id: "env"; config: platform.EnvDevToolProps }
  | { id: "pay-card"; config: walletXp.PayCardToolProps }
  | { id: "trustchain"; config: platform.TrustchainDevToolProps }
  | { id: "cloud-sync"; config: platform.CloudSyncDevToolProps };
