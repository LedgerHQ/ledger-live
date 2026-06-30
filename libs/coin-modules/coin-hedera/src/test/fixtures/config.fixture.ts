import type { HederaCoinConfig } from "../../config";

export const getMockedConfig = (): HederaCoinConfig => {
  return {
    status: { type: "active" },
    useNetworkTimestamp: false,
    networkType: "mainnet",
    apiUrls: {
      hgraph: "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql",
      mirrorNode: "https://hedera.coin.ledger.com",
    },
  };
};
