import { CoinType, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { BitcoinAccount } from "./types";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";

type FamilyConfig = {
  sync?: (acc: AccountShapeInfo<BitcoinAccount>) => Promise<Partial<BitcoinAccount>>;
};

const defaultFamilyConfig: FamilyConfig = {};

const zcashFamilyConfig: FamilyConfig = {
  sync: async (acc: AccountShapeInfo<BitcoinAccount>) => {
    const zcashlib = await import("ledgerhq/zcash-module");
    return zcashlib.sync(acc);
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
