import type { AlpacaApi, Operation } from "@ledgerhq/coin-framework/api/index";
import { xdr } from "@stellar/stellar-sdk";
import { StellarMemo } from "../types";
import { createApi, envelopeFromAnyXDR } from ".";

/**
 * Testnet scan: https://testnet.lumenscan.io/
 */
describe("Stellar Api", () => {
  let module: AlpacaApi<StellarMemo>;
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
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: "address",
        amount: amount,
        memo: { type: "NO_MEMO" },
      });

      // Then
      expect(result).toEqual({ value: BigInt(100) });
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];

    beforeAll(async () => {
      const result = await module.listOperations(ADDRESS, { minHeight: 0, order: "asc" });
      txs = result.items;
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(ADDRESS) || operation.recipients.includes(ADDRESS);
        expect(isSenderOrReceipt).toBe(true);
        expect(operation.value).toBeGreaterThanOrEqual(0);
        expect(operation.tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.height).toBeGreaterThanOrEqual(0);
        expect(operation.tx.fees).toBeGreaterThan(0);
        expect(operation.tx.date).toBeInstanceOf(Date);
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });

    it("returns all operations from the latest, but in asc order", async () => {
      const { items: txsDesc } = await module.listOperations(ADDRESS, {
        minHeight: 0,
        order: "desc",
      });
      expect(txsDesc[0]).toStrictEqual(txs[0]);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.getBalance(ADDRESS);

      // Then
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toMatchObject({
        value: expect.any(BigInt),
        asset: { type: "native" },
      });
      expect(result[0].value).toBeGreaterThan(0);
      result.slice(1).forEach(balance => {
        expect(balance.asset.type).not.toEqual("native");
        expect(balance.value).toBeGreaterThanOrEqual(0);
      });
    });

    it("returns 0 when address is not found", async () => {
      const result = await module.getBalance(
        "GAJSV2O545Z6ZK7FTPW2GOYNKMYJMP2REUJV4AW6DSYTYUHVI3000000",
      );

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" }, locked: 0n }]);
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
      const { transaction: result } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const envelope = envelopeFromAnyXDR(result, "base64");

      expect(envelope.toXDR("base64").length).toEqual(188);
    });

    it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
      const { transaction: transactionXdr } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const fees = readFees(transactionXdr);
      expect(fees).toBeGreaterThan(0);
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const { transaction: transactionXdr } = await module.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: TYPE,
          sender: ADDRESS,
          recipient: RECIPIENT,
          amount: AMOUNT,
          memo: { type: "NO_MEMO" },
        },
        { value: customFees },
      );

      const fees = readFees(transactionXdr);
      expect(fees).toEqual(Number(customFees));
    });

    it("should have no memo when not provided by user", async () => {
      const { transaction: transactionXdr } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoNone());
    });

    it("should have a memo when provided by user", async () => {
      const { transaction: transactionXdr } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: {
          type: "MEMO_TEXT",
          value: "test",
        },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoText(Buffer.from("test", "ascii")));
    });
  });
});
