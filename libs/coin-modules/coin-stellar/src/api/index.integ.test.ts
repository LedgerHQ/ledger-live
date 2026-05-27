import type { CoinModuleApi, Operation } from "@ledgerhq/coin-module-framework/api/index";
import { xdr } from "@stellar/stellar-sdk";
import { StellarMemo } from "../types";
import { createApi, envelopeFromAnyXDR } from ".";

/**
 * Testnet scan: https://testnet.lumenscan.io/
 */
describe("Stellar Api", () => {
  let module: CoinModuleApi<StellarMemo>;
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

    // 6-minute budget: the supplement step in `operationsFromHeight` issues
    // one extra `/ledgers/{seq}/operations` per distinct ledger touched, and
    // for a long-lived account like ADDRESS (hundreds of touched ledgers)
    // that adds many sequential requests against public testnet Horizon
    // (concurrency-capped + politely spaced to stay under the rate limit).
    // The 60s default was no longer enough.
    beforeAll(async () => {
      const result = await module.listOperations(ADDRESS, { minHeight: 0, order: "asc" });
      txs = result.items;
    }, 360_000);

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
        expect(operation.tx.feesPayer).toMatch(/^G[A-Z2-7]{55}$/);
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });

    // Same reasoning as the beforeAll: this does another full-history scan
    // (now in desc order), and the supplement makes it heavy against public
    // testnet Horizon.
    it(
      "returns all operations from the latest, but in asc order",
      async () => {
        const { items: txsDesc } = await module.listOperations(ADDRESS, {
          minHeight: 0,
          order: "desc",
        });
        expect(txsDesc[0]).toStrictEqual(txs[0]);
      },
      360_000,
    );
  });

  /**
   * Regression coverage for the Horizon recipient-gap (see
   * {@link operationsFromHeight}). `GAIH3ULL…` is a long-lived testnet faucet
   * account that previously surfaced the mismatch: `listOperations` (built on
   * `/accounts/{id}/operations`) returned a different count than `getBlock`
   * (built on `/ledgers/{seq}/operations`) for the same ledger sequence.
   *
   * The fix supplements forAccount results with per-ledger fetches, so for any
   * ledger we surface in `listOperations` the address-involving op count must
   * equal `getBlock`'s count for that same ledger. The window is bounded
   * (relative to `lastBlock`) so we paginate at most one Horizon page even
   * though the address has thousands of historical ops.
   */
  describe("listOperations / getBlock parity", () => {
    const PARITY_ADDRESS = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
    // Recent-ledger window: large enough that the faucet account has activity
    // most of the time (Stellar ledgers close ~every 5s, so ~1.5min of history),
    // small enough that the supplement + per-ledger getBlock fan-out stays
    // well below Horizon's public testnet rate-limit burst threshold.
    const LEDGER_WINDOW = 20;

    it("matches getBlock's address-involving op count for each touched ledger", async () => {
      const { height: latest } = await module.lastBlock();
      const minHeight = Math.max(latest - LEDGER_WINDOW, 1);

      const { items } = await module.listOperations(PARITY_ADDRESS, {
        minHeight,
        order: "desc",
      });

      // Sanity-check the precondition: the window must contain some activity,
      // otherwise the parity claim is vacuously true and the test isn't
      // meaningful. PARITY_ADDRESS is a long-lived testnet faucet, so this
      // should hold unless testnet was reset right before the test ran.
      expect(items.length).toBeGreaterThan(0);

      const opsPerLedger = new Map<number, number>();
      for (const op of items) {
        const h = op.tx.block.height;
        opsPerLedger.set(h, (opsPerLedger.get(h) ?? 0) + 1);
      }

      // Serialize the per-ledger getBlock calls to stay polite with public
      // Horizon: even with a small window, fanning out via Promise.all on top
      // of the supplement's per-ledger fetches has tipped the rate limiter.
      const heights = Array.from(opsPerLedger.keys());
      const blocks: Awaited<ReturnType<typeof module.getBlock>>[] = [];
      for (const h of heights) {
        blocks.push(await module.getBlock(h));
      }

      const blockAddressOpCount = new Map<number, number>();
      heights.forEach((height, i) => {
        let count = 0;
        for (const tx of blocks[i].transactions) {
          for (const op of tx.operations) {
            // Each Horizon op involving PARITY_ADDRESS yields exactly one
            // address-keyed BlockOperation: a `transfer` leg for that address,
            // or an `other` op whose `trustor` is the address (change_trust).
            // PARITY_ADDRESS is a one-way faucet so self-payments (which would
            // surface both transfer legs against the same address) aren't a
            // concern here; if that ever changes the comparison would need to
            // dedupe by Horizon op id.
            if (op.type === "transfer" && op.address === PARITY_ADDRESS) {
              count++;
            } else if (
              op.type === "other" &&
              (op as { trustor?: string }).trustor === PARITY_ADDRESS
            ) {
              count++;
            }
          }
        }
        blockAddressOpCount.set(height, count);
      });

      // Per-ledger equality first so a failing diff points at the specific
      // ledger that desynced; total is a defensive cross-check.
      expect(Object.fromEntries(blockAddressOpCount)).toEqual(Object.fromEntries(opsPerLedger));
      const blockOpsTotal = Array.from(blockAddressOpCount.values()).reduce((a, b) => a + b, 0);
      expect(blockOpsTotal).toBe(items.length);
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
