import { ChainAPI } from "../network";
import { getTransactions } from "../network/chain/web3";
import { parsedTransaction } from "./fixtures/helpers.fixture";

describe("getTransactions", () => {
  it("returns sorted valid transactions (filters failing, null, missing blockTime)", async () => {
    const mockAPI = {
      async getSignaturesForAddress() {
        return [
          { signature: "tx4" },
          { signature: "tx3" },
          { signature: "tx2" },
          { signature: "tx1" },
        ];
      },

      async getParsedTransactions() {
        return [
          parsedTransaction({
            signature: "tx2",
            slot: 12,
            blockTime: new Date(1000),
            meta: {
              err: null,
              fee: 0,
              preBalances: [],
              postBalances: [],
            },
          }),
          parsedTransaction({
            signature: "tx3", // ❌ failing
            slot: 14,
            blockTime: new Date(1000),
            meta: {
              err: "SomeError",
              fee: 0,
              preBalances: [],
              postBalances: [],
            },
          }),
          parsedTransaction({
            signature: "tx1", // ❌ missing blockTime
            slot: 10,
            meta: {
              err: null,
              fee: 0,
              preBalances: [],
              postBalances: [],
            },
          }),
          null, // ❌ null transaction (RPC issue)
          parsedTransaction({
            signature: "tx4",
            slot: 16,
            blockTime: new Date(4000),
            meta: {
              err: null,
              fee: 0,
              preBalances: [],
              postBalances: [],
            },
          }),
        ];
      },
    } as unknown as ChainAPI;

    const res = await getTransactions("main-address", undefined, mockAPI);

    // Expect: only tx4 and tx1, sorted by slot descending
    expect(res).toMatchObject([
      {
        info: { signature: "tx4" },
        parsed: { slot: 16, blockTime: 4 },
      },
      {
        info: { signature: "tx2" },
        parsed: { slot: 12, blockTime: 1 },
      },
    ]);
  });
});
