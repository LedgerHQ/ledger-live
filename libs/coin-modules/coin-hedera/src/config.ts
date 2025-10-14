import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type HederaCoinConfig = CurrencyConfig;

const coinConfig = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
