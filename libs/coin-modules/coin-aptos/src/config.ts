import type { AptosSettings } from "@aptos-labs/ts-sdk";
import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-framework/config";

export type AptosConfig = {
  aptosSettings: AptosSettings;
};

export type AptosCoinConfig = CurrencyConfig & AptosConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<AptosCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => AptosCoinConfig;
} = buildCoinConfig<AptosCoinConfig>();

export default coinConfig;
