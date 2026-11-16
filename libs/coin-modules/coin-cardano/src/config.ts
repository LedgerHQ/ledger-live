import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type CardanoConfig = {
  maxFeesWarning: number;
  maxFeesError: number;
  testnet: boolean;
  api: { url: string };
  epochParams: { url: string };
  keychainObservableRange: number;
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CardanoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CardanoCoinConfig;
} = buildCoinConfig<CardanoCoinConfig>();

export default coinConfig;

export const DEFAULT_KEYCHAIN_OBSERVABLE_RANGE = 20;

export const getKeychainObservableRange = (config: CardanoCoinConfig): number =>
  Number.isInteger(config.keychainObservableRange) && config.keychainObservableRange > 0
    ? config.keychainObservableRange
    : DEFAULT_KEYCHAIN_OBSERVABLE_RANGE;

export const cardanoDefaults = {
  cardano: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Cardano",
    unit: { name: "ada", code: "ADA", magnitude: 6 },
    maxFeesWarning: 5e6,
    maxFeesError: 10e6,
    testnet: false,
    api: { url: "https://cardano.coin.ledger.com/api" },
    epochParams: { url: "https://ada.api.live.ledger.com/api/rest/params" },
    keychainObservableRange: DEFAULT_KEYCHAIN_OBSERVABLE_RANGE,
  },
  cardano_testnet: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Cardano (Testnet)",
    unit: { name: "ada", code: "tADA", magnitude: 6 },
    maxFeesWarning: 5e6,
    maxFeesError: 10e6,
    testnet: true,
    api: { url: "https://ledger-preprod.cardanoscan.io/api" },
    epochParams: { url: "https://ada-testnet.api.live.ledger-test.com/api/rest/params" },
    keychainObservableRange: DEFAULT_KEYCHAIN_OBSERVABLE_RANGE,
  },
} satisfies Record<string, CardanoCoinConfig>;
