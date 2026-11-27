import type { AssetManagementSideEffects } from "../ports";
import type { AssetManagementUpdate } from "../types";

const ASSET_MANAGEMENT_KEYS: ReadonlySet<string> = new Set<AssetManagementUpdate["key"]>([
  "hideEmptyTokenAccounts",
  "filterTokenOperationsZeroAmount",
]);

/** Tells whether a change of the Settings port belongs to the Asset management section. */
export function isAssetManagementUpdate(
  update: Readonly<{ key: string }>,
): update is AssetManagementUpdate {
  return ASSET_MANAGEMENT_KEYS.has(update.key);
}

/** Runs the side effect of one change: exactly one call, chosen by the key. */
export function applyAssetManagementUpdate(
  effects: AssetManagementSideEffects,
  update: AssetManagementUpdate,
): void {
  switch (update.key) {
    case "hideEmptyTokenAccounts":
      effects.setHideEmptyTokenAccounts(update.value);
      return;
    case "filterTokenOperationsZeroAmount":
      effects.setFilterTokenOperationsZeroAmount(update.value);
      return;
  }
}
