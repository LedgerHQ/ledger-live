import type { AptosSettings } from "@aptos-labs/ts-sdk";
import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type AptosConfig = {
  aptosSettings: AptosSettings;
};

export type AptosCoinConfig = CurrencyConfig & AptosConfig;

/** The {@link Context} threaded through the coin-aptos API layer (ADR-019). */
export type AptosContext = Context<AptosCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AptosCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AptosCoinConfig;
} = buildCoinConfig<AptosCoinConfig>();

export default coinConfig;
