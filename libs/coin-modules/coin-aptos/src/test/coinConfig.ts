import type { AptosBridgeConfig, AptosInfra } from "../config";

/** The endpoints the app ships by default, one entry per currency. */
export const defaultAptosInfra: Record<string, AptosInfra> = {
  aptos: {
    APTOS_API_ENDPOINT: "https://apt.coin.ledger.com/node",
    APTOS_INDEXER_ENDPOINT: "https://apt.coin.ledger.com/indexer",
  },
  aptos_testnet: {
    APTOS_API_ENDPOINT: "https://api.testnet.aptoslabs.com/v1",
    APTOS_INDEXER_ENDPOINT: "https://api.testnet.aptoslabs.com/v1/graphql",
  },
};

export const getMockAptosBridgeConfig = (currencyId = "aptos"): AptosBridgeConfig => ({
  status: { type: "active" },
  infra: defaultAptosInfra[currencyId],
});
