import { Observable } from "rxjs";
import { CoinType, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { BitcoinAccount } from "./types";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { SyncConfig } from "@ledgerhq/types-live";
import { syncShielded } from "@ledgerhq/zcash-shielded";
import type { ShieldedSyncResult } from "@ledgerhq/zcash-shielded";

type FamilyConfig = {
  sync?: (
    acc: AccountShapeInfo<BitcoinAccount>,
    syncConfig: SyncConfig,
  ) => Observable<ShieldedSyncResult>;
};

const defaultFamilyConfig: FamilyConfig = {};

const zcashFamilyConfig: FamilyConfig = {
  sync: (acc: AccountShapeInfo<BitcoinAccount>, _syncConfig: SyncConfig) => {
    return syncShielded(acc);
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
