import type { HederaCoinConfig, HederaContext } from "../../types";

export const getMockedConfig = (overrides?: Partial<HederaCoinConfig>): HederaCoinConfig => {
  return {
    status: { type: "active" },
    useNetworkTimestamp: false,
    networkType: "mainnet",
    claimRewardsRecipient: "0.0.163372",
    ledgerNodeId: -1,
    tokenAssociationMinUsd: 0.05,
    apiUrls: {
      hgraph: "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql",
      mirrorNode: "https://hedera.coin.ledger.com",
    },
    ...overrides,
  };
};

/** A {@link HederaContext} backed by the mocked config, for api/logic tests. */
export const getMockedContext = (overrides?: Partial<HederaCoinConfig>): HederaContext => ({
  config: async () => getMockedConfig(overrides),
  logger: () => {},
});
