import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type MinaCoinConfig = () => CurrencyConfig & {
  infra: {
    API_VALIDATORS_BASE_URL: string;
    API_MINA_ROSETTA_NODE: string;
    API_MINA_GRAPHQL_NODE: string;
  };
};

let coinConfig: MinaCoinConfig | undefined;

export const setCoinConfig = (config: MinaCoinConfig): void => {
  coinConfig = config;
};

/** Clears in-memory config. For unit tests only; do not use in app code. */
export const resetCoinConfigForTesting = (): void => {
  coinConfig = undefined;
};

export const getCoinConfig = (): ReturnType<MinaCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Mina module config not set");
  }

  return coinConfig();
};

export const minaDefaults = {
  mina: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Mina",
    unit: { name: "MINA", code: "MINA", magnitude: 9 },
    infra: {
      API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
      API_VALIDATORS_BASE_URL: "https://mina.coin.ledger.com/node/validators",
    },
  },
} satisfies Record<string, ReturnType<MinaCoinConfig>>;
