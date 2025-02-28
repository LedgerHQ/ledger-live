import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

/**
 * Testnet scan: https://testnet.lumenscan.io/
 */
describe("Stellar Api", () => {
  let module: Api;
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
      const result = await module.estimateFees(address, amount);

      // Then
      expect(result).toEqual(BigInt(100));
    });
  });

  describe.only("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0 });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(100);
      tx.forEach(operation => {
        expect(operation.address).toEqual(address);
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0 });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(tx.map(elt => elt.hash));
      expect(checkSet.size).toEqual(tx.length);
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
      // When
      const result = await module.craftTransaction(address, {
        type: "send",
        recipient: "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX",
        amount: BigInt(1_000_000),
        fee: BigInt(100),
      });

      // Then
      expect(result.slice(0, 67)).toEqual(
        "AAAAAgAAAAD9Ai6ZfJT42rd0Nl8YJeODFgju688SXPzMZvSA369YPwAAAGQAAHloAAA",
      );
      expect(result.slice(70)).toEqual(
        "AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAAD9Ai6ZfJT42rd0Nl8YJeODFgju688SXPzMZvSA369YPwAAAAAAAAAAAA9CQAAAAAAAAAAA",
      );
    });
  });
});
