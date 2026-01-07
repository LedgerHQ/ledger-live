import type { TezosApi } from "./types";
import { createApi } from ".";

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
      expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe("encode", () => {
    it("encode a reveal operation without failing", async () => {
      // When
      const result = await module.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3",
          senderPublicKey: "03576c19462a7d0cc3d121b1b00e92258b5f71d643c99a599fc1683f03abb7a1c2",
          recipient: "tz2TLTEWhG87pPKK7MxYLavitGGwje1znRwQ",
          amount: BigInt(500000),
        },
        { value: BigInt(832) },
      );

      expect(result).toEqual({ transaction: expect.stringMatching(/^([A-Fa-f0-9]{2})+$/) });
    });
  });
});
