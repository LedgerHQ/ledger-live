import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type KaspaCoinConfig = CurrencyConfig;

const coinConfig = buildConConfig<KaspaCoinConfig>();

export default coinConfig;
