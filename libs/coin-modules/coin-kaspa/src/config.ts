import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

// export type KaspaConfig = {};

export type KaspaCoinConfig = CurrencyConfig;

const coinConfig = buildConConfig<KaspaCoinConfig>();

export default coinConfig;
