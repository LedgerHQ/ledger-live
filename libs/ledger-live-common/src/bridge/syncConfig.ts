import { SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT, type SyncConfig } from "@ledgerhq/types-live";
import { isZcashCurrencyId } from "./zcashRouting";

/** The config of a full account sync, as the background sync runs it. */
export function legacySyncConfig(currencyId: string, blacklistedTokenIds: string[]): SyncConfig {
  return {
    paginationConfig: {},
    blacklistedTokenIds,
    ...(isZcashCurrencyId(currencyId)
      ? { syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED }
      : {}),
  };
}
