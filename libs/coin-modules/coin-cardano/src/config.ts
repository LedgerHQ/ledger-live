import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type CardanoConfig = {
  maxFeesWarning: number;
  maxFeesError: number;
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

const coinConfig = buildCoinConfig<CardanoCoinConfig>();

export default coinConfig;
