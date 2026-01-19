import type { HederaCoinConfig } from "../../config";

export const getMockedConfig = (): HederaCoinConfig => {
  return {
    status: { type: "active" },
    useHgraphForErc20: false,
    useNetworkTimestamp: false,
    networkType: "mainnet",
    apiUrls: {
      hgraph: "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql",
      mirrorNode: "https://hedera.coin.ledger.com",
    },
  };
};
