import buildCoinConfig, {
  type CoinConfig,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export type CardanoConfig = {
  maxFeesWarning: number;
  maxFeesError: number;
  testnet: boolean;
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CardanoCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CardanoCoinConfig;
} = buildCoinConfig<CardanoCoinConfig>();

export default coinConfig;

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
  },
} satisfies Record<string, CardanoCoinConfig>;
