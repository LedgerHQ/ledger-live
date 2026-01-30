import { Observable, defer, from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { CoinType, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { BitcoinAccount } from "./types";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { SyncConfig } from "@ledgerhq/types-live";
import type { ShieldedSyncResult } from "@ledgerhq/zcash-shielded";

type FamilyConfig = {
  sync?: (
    acc: AccountShapeInfo<BitcoinAccount>,
    syncConfig: SyncConfig,
  ) => Observable<ShieldedSyncResult>;
};

const defaultFamilyConfig: FamilyConfig = {};

let zcashShieldedModuleCache: Promise<typeof import("@ledgerhq/zcash-shielded")> | null = null;

const getZcashShieldedModule = (): Promise<typeof import("@ledgerhq/zcash-shielded")> => {
  if (!zcashShieldedModuleCache) {
    zcashShieldedModuleCache = import("@ledgerhq/zcash-shielded");
  }
  return zcashShieldedModuleCache;
};

// Lazy load zcash-shielded only when needed for Zcash currency
// The module is cached to avoid reloading on subsequent calls
const zcashFamilyConfig: FamilyConfig = {
  sync: (acc: AccountShapeInfo<BitcoinAccount>, _syncConfig: SyncConfig) => {
    return defer(() =>
      from(getZcashShieldedModule()).pipe(mergeMap(module => module.syncShielded(acc))),
    );
  },
};

export type BitcoinConfigInfo = CurrencyConfig;

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};

export type CoinConfig = (currency: CryptoCurrency) => BitcoinCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (
  currency: CryptoCurrency,
): BitcoinCoinConfig & { family: FamilyConfig } => {
  if (!coinConfig) {
    throw new Error("Bitcoin module config not set");
  }

  const coin = coinConfig(currency);
  const family = currency.coinType === CoinType.ZCASH ? zcashFamilyConfig : defaultFamilyConfig;

  return {
    ...coin,
    family,
  };
};
