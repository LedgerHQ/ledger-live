import * as engagement from "./metadata/engagement";
import * as platform from "./metadata/platform";
import * as walletXp from "./metadata/wallet-xp";

export const tools = {
  "feature-flags": platform.featureFlags,
  env: platform.env,
  "pay-card": walletXp.payCard,
  trustchain: platform.trustchain,
  "cloud-sync": platform.cloudSync,
  "device-onboarding": engagement.deviceOnboarding,
  "account-balance": walletXp.accountBalance,
  "account-operation": walletXp.accountOperation,
  "account-portfolio": platform.accountPortfolio,
  "account-descriptor": platform.accountDescriptor,
  "account-data": platform.accountData,
  "account-source-portfolio": platform.accountSourcePortfolio,
  "app-config": platform.appConfig,
  "account-name": platform.accountName,
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
  | { id: "cloud-sync"; config: platform.CloudSyncDevToolProps }
  | { id: "device-onboarding"; config: engagement.DeviceOnboardingToolProps }
  | { id: "account-balance"; config: walletXp.AccountBalanceToolProps }
  | { id: "account-operation"; config: walletXp.AccountOperationToolProps }
  | { id: "account-portfolio"; config: platform.AccountPortfolioToolProps }
  | { id: "account-descriptor"; config: platform.AccountDescriptorToolProps }
  | { id: "account-data"; config: platform.AccountDataToolProps }
  | { id: "account-source-portfolio"; config: platform.PortfolioSourceToolProps }
  | { id: "app-config"; config: platform.AppConfigToolProps }
  | { id: "account-name"; config: platform.AccountNameToolProps };
