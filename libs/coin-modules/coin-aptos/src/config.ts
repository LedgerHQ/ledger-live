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

export type AptosInfra = {
  APTOS_API_ENDPOINT: string;
  APTOS_INDEXER_ENDPOINT: string;
};

/** Config of the account bridge, which builds its client from a currency id. */
export type AptosBridgeConfig = CurrencyConfig & {
  infra: AptosInfra;
};

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AptosBridgeConfig>) => void;
  getCoinConfig: (currencyId?: string) => AptosBridgeConfig;
} = buildCoinConfig<AptosBridgeConfig>();

export default coinConfig;
