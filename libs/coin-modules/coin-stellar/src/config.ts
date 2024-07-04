import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type StellarConfig = Record<string, never>;

export type StellarCoinConfig = CurrencyConfig & StellarConfig;

const coinConfig = buildCoinConfig<StellarCoinConfig>();

export default coinConfig;
