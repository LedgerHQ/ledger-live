import type { Api, Operation } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import { StellarToken } from "../types";

/**
 * Testnet scan: https://testnet.lumenscan.io/
 */
describe("Stellar Api", () => {
  let module: Api<StellarToken>;
  const address = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100_000);

      // When
      const result = await module.estimateFees({
        type: "send",
        sender: address,
        recipient: "address",
        amount: amount,
      });

      // Then
      expect(result).toEqual(BigInt(100));
    });
  });

  describe("listOperations", () => {
    let txs: Operation<StellarToken>[];

    beforeAll(async () => {
      [txs] = await module.listOperations(address, { minHeight: 0 });
    }, 20 * 1000); // 20s

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      const result = await module.craftTransaction({
        type: "send",
        sender: address,
        recipient: "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX",
        amount: BigInt(1_000_000),
      });

      expect(result.length).toEqual(188);
    });
  });
});
