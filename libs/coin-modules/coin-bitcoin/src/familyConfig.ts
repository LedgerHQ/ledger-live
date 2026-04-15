import { defer, from, mergeMap, Observable } from "rxjs";
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { ZCash } from "@ledgerhq/zcash-shielded/ZCash";
import type { ZcashPrivateInfo } from "@ledgerhq/zcash-shielded/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { SyncConfig } from "@ledgerhq/types-live";
import type { ZcashAccount } from "./types";

export type FamilyConfig = {
  sync?: (
    acc: AccountShapeInfo<ZcashAccount>,
    syncConfig: SyncConfig,
  ) => Observable<Partial<ZcashPrivateInfo>>;
};

const ZCASH_MAX_BATCH_SIZE = 100;

// Lazy load zcash-shielded only when needed for Zcash currency
// The module is cached to avoid reloading on subsequent calls
let zcashShieldedModuleCache: Promise<{
  ZCash: typeof ZCash;
  ZCASH_JSON_RPC_SERVER_MAINNET: string;
}> | null = null;

const getZcashShieldedModule = () => {
  zcashShieldedModuleCache ??= import("@ledgerhq/zcash-shielded/ZCash");
  return zcashShieldedModuleCache;
};

const zcashSyncShielded = (acc: AccountShapeInfo<ZcashAccount>, _syncConfig: SyncConfig) => {
  return defer(() =>
    from(getZcashShieldedModule()).pipe(
      mergeMap(zcashModule => {
        const viewingKey = acc.initialAccount?.privateInfo?.ufvk;
        if (!viewingKey) {
          throw new Error("Missing unified full viewing key (ufvk) for ZCash shielded sync");
        }

        const zcash = new zcashModule.ZCash({
          nodeUrl: zcashModule.ZCASH_JSON_RPC_SERVER_MAINNET,
        });

        const startBlockHeight = acc.initialAccount?.blockHeight
          ? acc.initialAccount.blockHeight + 1
          : 0;

        return zcash.syncShielded({
          startBlockHeight,
          viewingKey,
          maxBatchSize: ZCASH_MAX_BATCH_SIZE,
        });
      }),
    ),
  );
};

export const findFamilyConfigById = (
  cryptoCurrencyId: CryptoCurrencyId,
): FamilyConfig | undefined => {
  if (cryptoCurrencyId === "zcash") {
    return {
      sync: zcashSyncShielded,
    };
  }
};
