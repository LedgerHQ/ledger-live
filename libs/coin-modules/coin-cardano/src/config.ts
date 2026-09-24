import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type CardanoInfra = {
  CARDANO_API_ENDPOINT: string;
  /** Current-epoch protocol params (validator APY), served by a different host than the API. */
  CARDANO_EPOCH_PARAMS_ENDPOINT: string;
};

export type CardanoConfig = {
  maxFeesWarning: number;
  maxFeesError: number;
  infra: CardanoInfra;
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CardanoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CardanoCoinConfig;
} = buildCoinConfig<CardanoCoinConfig>();

export default coinConfig;
