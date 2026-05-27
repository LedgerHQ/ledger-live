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
    it("returns all operations from the latest, but in asc order", async () => {
      const { items: txsDesc } = await module.listOperations(ADDRESS, {
        minHeight: 0,
        order: "desc",
      });
      expect(txsDesc[0]).toStrictEqual(txs[0]);
    }, 360_000);
  });

  /**
   * Regression coverage for the Horizon `forAccount` recipient-gap (see
   * {@link operationsFromHeight}). `GAIH3ULL…` is a long-lived testnet faucet
   * account where Horizon's `/accounts/{id}/operations` (and
   * `/accounts/{id}/payments`) endpoints — both backed by
   * `history_operation_participants` — omit 19 incoming payments where the
   * faucet is only the recipient (the fee payer is a different account).
   * Without the supplement, `listOperations` returns 3437 ops for this
   * address; per-ledger fetches via `/ledgers/{seq}/operations` (which
   * `getBlock` uses) yield 3456.
   *
   * Those missing ops are concentrated in testnet ledgers
   * 2_673_006–2_673_016. We pin that range so the test exercises the actual
   * reported gap deterministically: the previous "last N ledgers" window was
   * only meaningful when the faucet happened to be active right before the
   * test ran, which rarely overlapped the buggy ledgers.
   */
  describe("listOperations supplements Horizon forAccount gap", () => {
    const PARITY_ADDRESS = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
    const KNOWN_GAP_MIN_HEIGHT = 2_673_006;
    const KNOWN_GAP_MAX_HEIGHT = 2_673_016;
    // Bug report listed exactly 19 incoming payments missed by forAccount in
    // this ledger range. Asserting the ground-truth count meets this floor
    // guards against a stale assumption (e.g. Horizon backfilling its index,
    // upstream testnet history mutation) silently turning the test vacuous.
    const REPORTED_MISSING_OPS = 19;

    it(
      "recovers the 19 incoming faucet payments Horizon forAccount index drops",
      async () => {
        // Ground truth: per-ledger fetch (same source `getBlock` uses) across
        // the pinned range, counting only ops that involve PARITY_ADDRESS.
        const expectedPerLedger = new Map<number, number>();
        for (let h = KNOWN_GAP_MIN_HEIGHT; h <= KNOWN_GAP_MAX_HEIGHT; h++) {
          const block = await module.getBlock(h);
          let count = 0;
          for (const tx of block.transactions) {
            for (const op of tx.operations) {
              // Each Horizon op involving PARITY_ADDRESS yields exactly one
              // address-keyed BlockOperation: a `transfer` leg for that
              // address, or an `other` op whose `trustor` is the address
              // (change_trust). PARITY_ADDRESS is a one-way faucet so
              // self-payments (which would surface both transfer legs
              // against the same address) aren't a concern here.
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
          if (count > 0) {
            expectedPerLedger.set(h, count);
          }
        }
        const expectedTotal = Array.from(expectedPerLedger.values()).reduce((a, b) => a + b, 0);
        expect(expectedTotal).toBeGreaterThanOrEqual(REPORTED_MISSING_OPS);

        // Paginate `forAccount` desc from latest back to KNOWN_GAP_MIN_HEIGHT
        // and run the per-ledger supplement. Bounding via `minHeight` keeps
        // the scan + supplement cost roughly proportional to the faucet's
        // recent (post-2_673_006) activity rather than its full history.
        const { items } = await module.listOperations(PARITY_ADDRESS, {
          minHeight: KNOWN_GAP_MIN_HEIGHT,
          order: "desc",
        });

        // Filter to the pinned range so we compare the same slice as ground
        // truth above. Without the supplement, this map would be missing
        // (or under-counting) entries for the buggy ledgers.
        const actualPerLedger = new Map<number, number>();
        for (const op of items) {
          const h = op.tx.block.height;
          if (h < KNOWN_GAP_MIN_HEIGHT || h > KNOWN_GAP_MAX_HEIGHT) continue;
          actualPerLedger.set(h, (actualPerLedger.get(h) ?? 0) + 1);
        }

        // Per-ledger equality so a failing diff points at the specific
        // ledger that still desyncs (and how many ops are still missing).
        expect(Object.fromEntries(actualPerLedger)).toEqual(
          Object.fromEntries(expectedPerLedger),
        );
      },
      600_000,
    );
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
