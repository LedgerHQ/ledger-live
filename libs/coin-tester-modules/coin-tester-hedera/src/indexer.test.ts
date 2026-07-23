import { initMswHandlers } from "./indexer";
import { FAKE_HGRAPH_URL } from "./fixtures";

describe("initMswHandlers", () => {
  let close: () => void;

  afterEach(() => {
    close?.();
  });

  // Pins coin-hedera's invariant that ethereum_transaction must never be empty.
  it("answers getLatestIndexedConsensusTimestamp with a non-empty ethereum_transaction row", async () => {
    close = initMswHandlers();

    const res = await fetch(FAKE_HGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query LatestTransaction { ethereum_transaction(limit: 1) { consensus_timestamp } }",
      }),
    });
    const body = await res.json();

    expect(body.data.ethereum_transaction).toHaveLength(1);
    expect(body.data.ethereum_transaction[0].consensus_timestamp).toBeDefined();
  });
});
