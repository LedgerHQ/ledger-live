import type { UpdateOf } from "@features/flow-settings";

export type AssetManagementPlatform = "desktop" | "mobile";

export type AssetManagementSettingsValues = Readonly<{
  hideEmptyTokenAccounts: boolean;
  filterTokenOperationsZeroAmount: boolean;
}>;

export type AssetManagementUpdate = UpdateOf<AssetManagementSettingsValues>;

export type HiddenToken = Readonly<{ id: string; name: string; ticker: string }>;

/** The hidden tokens of one network, the parent currency of the tokens. */
export type HiddenTokenGroup = Readonly<{
  network: Readonly<{ id: string; name: string }>;
  tokens: readonly HiddenToken[];
}>;
