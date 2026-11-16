import type { CasperCoinConfig, CasperConfig } from "./types/config";

let coinConfig: CasperCoinConfig | undefined;

export const setCoinConfig = (config: CasperCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<CasperCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Casper module config not set");
  }

  return coinConfig();
};

export const casperDefaults = {
  casper: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Casper",
    unit: { name: "CSPR", code: "CSPR", magnitude: 9 },
    infra: {
      API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
      API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
    },
  },
} satisfies Record<string, CasperConfig>;
