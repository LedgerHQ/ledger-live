import type { Api, Operation } from "@ledgerhq/coin-framework/api/index";
import { xdr } from "@stellar/stellar-sdk";
import { createApi, envelopeFromAnyXDR } from ".";
import { StellarAsset } from "../types";

/**
 * Testnet scan: https://testnet.lumenscan.io/
 *
 * Tests are skipped for the moment due to TooManyRequest errors
 */
describe.skip("Stellar Api", () => {
  let module: Api<StellarAsset>;
  const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

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
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: "address",
        amount: amount,
      });

      // Then
      expect(result).toEqual(BigInt(100));
    });
  });

  describe("listOperations", () => {
    let txs: Operation<StellarAsset>[];

    beforeAll(async () => {
      [txs] = await module.listOperations(ADDRESS, { minHeight: 0 });
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(ADDRESS) || operation.recipients.includes(ADDRESS);
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
      const result = await module.getBalance(ADDRESS);

      // Then
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction", () => {
    const TYPE = "send";
    const RECIPIENT = "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX";
    const AMOUNT = BigInt(1_000_000);

    function readFees(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return transactionEnvelope.value().tx().fee();
    }

    function readMemo(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return (transactionEnvelope.value().tx() as xdr.TransactionV0).memo();
    }

    it("returns a raw transaction", async () => {
      const result = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      });

      const envelope = envelopeFromAnyXDR(result, "base64");

      expect(envelope.toXDR("base64").length).toEqual(188);
    });

    it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      });

      const fees = readFees(transactionXdr);
      expect(fees).toBeGreaterThan(0);
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const transactionXdr = await module.craftTransaction(
        {
          asset: { type: "native" },
          type: TYPE,
          sender: ADDRESS,
          recipient: RECIPIENT,
          amount: AMOUNT,
        },
        customFees,
      );

      const fees = readFees(transactionXdr);
      expect(fees).toEqual(Number(customFees));
    });

    it("should have no memo when not provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoNone());
    });

    it("should have a memo when provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memoType: "MEMO_TEXT",
        memoValue: "test",
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoText(Buffer.from("test", "ascii")));
    });
  });
});
