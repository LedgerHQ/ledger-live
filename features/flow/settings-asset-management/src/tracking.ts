import type { AssetManagementPlatform, AssetManagementSettingsValues } from "./types";

/** An event the section sends each time its state changes. `id` keeps the event across renders. */
export type AssetManagementStateEvent = Readonly<{
  id: string;
  event: string;
  properties?: Readonly<Record<string, unknown>>;
}>;

type TrackedState = AssetManagementSettingsValues & Readonly<{ isHiddenTokensOpen: boolean }>;

/**
 * The events the legacy desktop Accounts screen sends when a toggle or the hidden tokens list
 * changes. The mobile screen never sent them.
 */
export function getAssetManagementStateEvents(
  { hideEmptyTokenAccounts, filterTokenOperationsZeroAmount, isHiddenTokensOpen }: TrackedState,
  platform: AssetManagementPlatform,
): readonly AssetManagementStateEvent[] {
  if (platform === "mobile") return [];

  return [
    {
      id: "hideEmptyTokenAccounts",
      event: hideEmptyTokenAccounts
        ? "hideEmptyTokenAccountsEnabled"
        : "hideEmptyTokenAccountsDisabled",
    },
    {
      id: "filterTokenOperationsZeroAmount",
      event: filterTokenOperationsZeroAmount
        ? "filterTokenOperationsZeroAmountEnabled"
        : "filterTokenOperationsZeroAmountDisabled",
    },
    {
      id: "hiddenTokens",
      event: "BlacklistedTokens dropdown",
      properties: { opened: isHiddenTokensOpen },
    },
  ];
}
