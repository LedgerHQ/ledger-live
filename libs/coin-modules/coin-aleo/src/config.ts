import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";

export type AleoConfig = {
  nodeUrl: string;
};

export type AleoCoinConfig = CurrencyConfig & AleoConfig;

const coinConfig = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
