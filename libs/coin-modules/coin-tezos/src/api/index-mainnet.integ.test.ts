import { createApi } from ".";
import type { TezosApi } from "./types";

/**
 * Mainnet-specific integration tests
 * Please implement your tests in testnet-specific tests file (see index.integ.test.ts)
 * Use this test suite in last resort
 */
describe("Tezos Api - Mainnet", () => {
  let module: TezosApi;

  beforeAll(() => {
    module = createApi({
      baker: {
        url: "https://baker.example.com",
      },
      explorer: {
        url: "https://xtz-tzkt-explorer.api.vault.ledger.com",
        maxTxQuery: 100,
      },
      node: {
        url: "https://xtz-node.api.vault.ledger.com",
      },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 500,
        minEstimatedFees: 500,
      },
    });
  });

  describe("estimateFees", () => {
    it("fallback to an estimation without the public key", async () => {
      // When
      const result = await module.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: "tz2BHzkaizWwCmhYswwTQCycgT8mXFH8QTL5",
        senderPublicKey: "038ad002bc17d427794e148c9b9b464e977dc3cbc4d76148e97641ae86e46ec176",
        recipient: "tz2JpHaYBjGdTq7b5mWFpG9AP3L3CckdRJcA",
        amount: BigInt(100),
      });

      expect(result.value).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
    });
  });
});
