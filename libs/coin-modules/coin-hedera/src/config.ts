import buildCoinConfig, { type CoinConfig } from "@ledgerhq/coin-module-framework/config";
import type { HederaCoinConfig } from "./types";

const coinConfig: {
  setCoinConfig: (config: CoinConfig<HederaCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => HederaCoinConfig;
} = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
