import coinConfig, { TezosCoinConfig } from "../config";
import { fetchAllTransactions } from "../network/tzkt";

jest.setTimeout(2 * 60 * 1000);

describe("TEZOS_MAX_TX_QUERIES", () => {
  const tezosConfig = {
    status: { type: "active" },
    baker: {
      url: "https://tezos-bakers.api.live.ledger.com",
    },
    explorer: {
      url: "https://xtz-tzkt-explorer.api.live.ledger.com",
      maxTxQuery: 100,
    },
    node: {
      url: "https://xtz-node.api.live.ledger.com",
    },
  } satisfies TezosCoinConfig;
  const bigAccount = "tz1boBHAVpwcvKkNFAQHYr7mjxAz1PpVgKq7";

  test("default have more than 100 txs", async () => {
    // Given
    coinConfig.setCoinConfig((): TezosCoinConfig => tezosConfig);

    const txs = await fetchAllTransactions(bigAccount);
    expect(txs.length).toBeGreaterThan(100);
  });
  test("lowering it to 1 will only fetch a few txs", async () => {
    // Given
    coinConfig.setCoinConfig(
      (): TezosCoinConfig => ({
        ...tezosConfig,
        explorer: {
          url: "https://xtz-tzkt-explorer.api.live.ledger.com",
          maxTxQuery: 1,
        },
      }),
    );

    const txs = await fetchAllTransactions(bigAccount);
    expect(txs.length).toBeLessThanOrEqual(100);
  });
});
