/** The rows of the Asset management section, in order. The same on both platforms. */
export const ASSET_MANAGEMENT_ROW_IDS = [
  "hideEmptyTokenAccounts",
  "filterTokenOperationsZeroAmount",
  "hiddenTokens",
] as const;

export type AssetManagementRowId = (typeof ASSET_MANAGEMENT_ROW_IDS)[number];
