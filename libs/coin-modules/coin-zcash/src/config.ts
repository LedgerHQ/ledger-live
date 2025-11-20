import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type ZcashConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type ZcashCoinConfig = CurrencyConfig & ZcashConfig;

const coinConfig = buildCoinConfig<ZcashCoinConfig>();

export default coinConfig;
