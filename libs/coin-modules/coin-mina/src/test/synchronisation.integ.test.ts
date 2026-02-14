// Mock the config module
jest.mock("../config", () => ({
  getCoinConfig: () => ({
    status: {
      type: "active",
    },
    infra: {
      API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
      API_VALIDATORS_BASE_URL: "https://mina.coin.ledger.com/node/validators",
    },
  }),
  setCoinConfig: jest.fn(),
}));

import { getTransactions } from "../api";
import { mapRosettaTxnToOperation } from "../bridge/synchronisation";

describe("synchronisation", () => {
  it("should map rosetta txn to operation", async () => {
    const txns = await getTransactions("B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD");
    const ops = (
      await Promise.all(txns.flatMap(t => mapRosettaTxnToOperation("accountId", "address", t)))
    ).flat();

    expect(ops.length).toBeGreaterThan(0);
  }, 1000000);
});
