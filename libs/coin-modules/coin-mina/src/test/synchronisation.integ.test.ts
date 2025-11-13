// Mock the config module
jest.mock("../config", () => ({
  getCoinConfig: () => ({
    status: {
      type: "active",
    },
    infra: {
      API_VALIDATORS_BASE_URL: "https://api.minaexplorer.com",
      API_MINA_ROSETTA_NODE: "https://rosetta.minaprotocol.network",
      API_MINA_GRAPHQL_NODE: "https://graphql.minaexplorer.com",
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
