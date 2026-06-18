import type { CoinModuleApi, Operation } from "@ledgerhq/coin-module-framework/api/index";
import { xdr } from "@stellar/stellar-sdk";
import { StellarMemo } from "../types";
import { createApi, envelopeFromAnyXDR } from ".";

/**
 * Mainnet explorer: https://stellar.expert/explorer/public
 */
describe("Stellar Api", () => {
  let module: CoinModuleApi<StellarMemo>;
  const ADDRESS = "GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://stellar.coin.ledger.com",
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

      expect(result.value).toBeGreaterThanOrEqual(100n);
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];
    let nextCursor: string | undefined;

    beforeAll(async () => {
      const result = await module.listOperations(ADDRESS, {
        minHeight: 0,
        order: "asc",
      });
      txs = result.items;
      nextCursor = result.next;
    });

    it("returns a page of operations for the address", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(1);
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
        expect(operation.tx.feesPayer).toMatch(/^G[A-Z2-7]{55}$/);
      });
    });

    it("returns unique operations within the page", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(1);
      const checkSet = new Set(txs.map(elt => elt.id));
      expect(checkSet.size).toEqual(txs.length);
    });

    it("returns a cursor for pagination when more pages exist", async () => {
      // The test account has enough operations to fill at least one page
      expect(typeof nextCursor).toBe("string");
    });

    it("supports cursor-based pagination", async () => {
      if (!nextCursor) return; // skip if account has fewer ops than page size
      const page2 = await module.listOperations(ADDRESS, {
        minHeight: 0,
        order: "asc",
        cursor: nextCursor,
      });
      expect(page2.items.length).toBeGreaterThanOrEqual(1);
      // No overlap between pages
      const page1Ids = new Set(txs.map(op => op.id));
      page2.items.forEach(op => {
        expect(page1Ids.has(op.id)).toBe(false);
      });
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

  /**
   * Signed transaction envelope from BACK-10960 / Jira (mainnet).
   * Live Horizon may report `tx_failed` + XDR `txFailed` (operation-level failure) while static ticket JSON showed `tx_no_source_account`.
   */
  describe("broadcast", () => {
    let broadcastModule: CoinModuleApi<StellarMemo>;
    const tx =
      "AAAAAgAAAABRUCgFba+DTbei2ifpyYt5w2Hh0VyZ+X9fayjIDne7YAAAAGQCkDOGAAAABQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAACEIuPfWXgM8WhyqjrpFdIcGV1SUVhMzPUm4YspNHF60QAAAAAAAAAAALkd2QAAAAAAAAABDne7YAAAAEAASzsT/yDIfCfEDstkfnznXjiN7rNd7PkKQEn+rRIFm9EHoirGfHipWoBdYMrc6ixQD/0y0of1piSid8TLiFAB";
    beforeAll(() => {
      broadcastModule = createApi({
        explorer: {
          url: "https://horizon.stellar.org/",
        },
      });
    });

    it("maps Horizon transaction failure to StellarBroadcastFailedError with XDR context", async () => {
      await expect(broadcastModule.broadcast(tx)).rejects.toMatchObject({
        name: "StellarBroadcastFailedError",
        documentationSummary: "One of the operations failed (none were applied).",
        horizonTransactionCode: "tx_failed",
        stellarDocUrl:
          "https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/transactions",
        decodedResultXdr: {
          feeChargedStroops: expect.stringMatching(/^\d+$/),
          resultSwitch: "txFailed",
        },
        envelopeXdr: tx,
        cause: expect.objectContaining({ name: "AxiosError" }),
      });
    });
  });
});
