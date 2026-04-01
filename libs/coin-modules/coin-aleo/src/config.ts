import buildCoinConfig, { type CoinConfig } from "@ledgerhq/coin-module-framework/config";
import type { AleoCoinConfig } from "./types";

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AleoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AleoCoinConfig;
} = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
