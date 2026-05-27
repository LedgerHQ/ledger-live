import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { LedgerAPI4xx } from "@ledgerhq/errors";

jest.mock("../network", () => ({
  fetchOpsForLedgerForAddress: jest.fn(),
}));
jest.mock("./listOperations", () => {
  const actual = jest.requireActual<typeof import("./listOperations")>("./listOperations");
  return {
    ...actual,
    listOperations: jest.fn(),
  };
});

import { fetchOpsForLedgerForAddress } from "../network";
import { listOperations } from "./listOperations";
import { operationsFromHeight } from "./operationsFromHeight";

// `setTimeout` is awaited inside the supplement (inter-batch sleep + 429
// backoff). Stub it to run synchronously so these tests stay fast.
beforeAll(() => {
  jest.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler) => {
    if (typeof fn === "function") (fn as () => void)();
    return 0 as unknown as NodeJS.Timeout;
  });
});
afterAll(() => {
  jest.restoreAllMocks();
});

const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

const listOperationsMock = listOperations as jest.MockedFunction<typeof listOperations>;
const fetchOpsForLedgerMock = fetchOpsForLedgerForAddress as jest.MockedFunction<
  typeof fetchOpsForLedgerForAddress
>;

/**
 * The supplement closes Horizon's recipient-gap in `/accounts/X/operations`
 * (where some incoming ops are missing because they're not indexed against
 * `address` in `history_operation_participants`). These tests isolate the
 * supplement by stubbing `listOperations` and `fetchOpsForLedgerForAddress` —
 * the end-to-end Stellar-SDK flow needs unrealistic Horizon fixtures.
 */
describe("operationsFromHeight supplement (recipient-gap fill)", () => {
  beforeEach(() => {
    listOperationsMock.mockReset();
    fetchOpsForLedgerMock.mockReset();
  });

  function makeLegacyOp(
    overrides: Partial<Operation> & { hash: string; index: string; height: number },
  ): Operation {
    const { hash, index, height, ...rest } = overrides;
    return {
      id: `${hash}-${index}`,
      type: "OUT",
      senders: [ADDRESS],
      recipients: [],
      value: 0n,
      asset: { type: "native" },
      tx: {
        hash,
        block: { hash: `blk-${height}`, time: new Date("2025-01-01"), height },
        fees: 0n,
        date: new Date("2025-01-01"),
        failed: false,
      },
      details: { index },
      ...rest,
    };
  }

  /**
   * Shape returned by `fetchOpsForLedgerForAddress` — same as `fetchOperations`,
   * i.e. ops from `rawOperationsToOperations`. The supplement re-keys them
   * through `convertToLegacyOperation` (id becomes `${hash}-${index}`).
   */
  function makePreLegacyOp(opts: {
    hash: string;
    index: string;
    height: number;
    type?: string;
    senders?: string[];
    recipients?: string[];
  }): Operation {
    return {
      id: `-${opts.hash}-${opts.type ?? "IN"}`,
      type: opts.type ?? "IN",
      senders: opts.senders ?? ["GOTHER"],
      recipients: opts.recipients ?? [ADDRESS],
      value: 0n,
      asset: { type: "native" },
      tx: {
        hash: opts.hash,
        block: { hash: `blk-${opts.height}`, time: new Date("2025-01-01"), height: opts.height },
        fees: 0n,
        date: new Date("2025-01-01"),
        failed: false,
      },
      details: { index: opts.index, ledgerOpType: opts.type ?? "IN" },
    };
  }

  it("adds an op that /accounts/X/operations missed but /ledgers/{seq}/operations returned", async () => {
    const known = makeLegacyOp({ hash: "tx-out", index: "100", height: 42 });
    listOperationsMock.mockResolvedValueOnce({ items: [known], next: undefined });

    const missed = makePreLegacyOp({ hash: "tx-in", index: "200", height: 42 });
    fetchOpsForLedgerMock.mockResolvedValueOnce([missed]);

    const result = await operationsFromHeight(ADDRESS, 0);

    expect(fetchOpsForLedgerMock).toHaveBeenCalledTimes(1);
    expect(fetchOpsForLedgerMock).toHaveBeenCalledWith(42, ADDRESS, "", 0);
    expect(result.items).toHaveLength(2);
    expect(result.items.map(o => o.id)).toEqual(["tx-in-200", "tx-out-100"]);
  });

  it("de-duplicates ops already present in the forAccount results", async () => {
    const known = makeLegacyOp({ hash: "tx-out", index: "100", height: 42 });
    listOperationsMock.mockResolvedValueOnce({ items: [known], next: undefined });

    const same = makePreLegacyOp({
      hash: "tx-out",
      index: "100",
      height: 42,
      type: "OUT",
      senders: [ADDRESS],
      recipients: [],
    });
    fetchOpsForLedgerMock.mockResolvedValueOnce([same]);

    const result = await operationsFromHeight(ADDRESS, 0);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("tx-out-100");
  });

  it("does not query ledgers when the forAccount result is empty", async () => {
    listOperationsMock.mockResolvedValueOnce({ items: [], next: undefined });

    const result = await operationsFromHeight(ADDRESS, 0);

    expect(fetchOpsForLedgerMock).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });

  it("queries each distinct ledger once across paginated forAccount results", async () => {
    const opA = makeLegacyOp({ hash: "tx-a", index: "1", height: 42 });
    const opB = makeLegacyOp({ hash: "tx-b", index: "2", height: 43 });
    const opC = makeLegacyOp({ hash: "tx-c", index: "3", height: 42 });

    listOperationsMock
      .mockResolvedValueOnce({ items: [opA, opB], next: "cursor-1" })
      .mockResolvedValueOnce({ items: [opC], next: undefined });

    fetchOpsForLedgerMock.mockResolvedValue([]);

    await operationsFromHeight(ADDRESS, 0);

    expect(fetchOpsForLedgerMock).toHaveBeenCalledTimes(2);
    const seqs = fetchOpsForLedgerMock.mock.calls.map(c => c[0]).sort();
    expect(seqs).toEqual([42, 43]);
  });

  it("skips supplement for ledgers below minHeight", async () => {
    const known = makeLegacyOp({ hash: "tx", index: "1", height: 50 });
    listOperationsMock.mockResolvedValueOnce({ items: [known], next: undefined });
    fetchOpsForLedgerMock.mockResolvedValue([]);

    await operationsFromHeight(ADDRESS, 40);
    expect(fetchOpsForLedgerMock).toHaveBeenCalledWith(50, ADDRESS, "", 40);

    fetchOpsForLedgerMock.mockClear();
    listOperationsMock.mockReset();

    const oldOp = makeLegacyOp({ hash: "tx2", index: "2", height: 10 });
    listOperationsMock.mockResolvedValueOnce({ items: [oldOp], next: undefined });
    await operationsFromHeight(ADDRESS, 100);
    expect(fetchOpsForLedgerMock).not.toHaveBeenCalled();
  });

  it("degrades gracefully when a per-ledger fetch fails", async () => {
    const known = makeLegacyOp({ hash: "tx-out", index: "100", height: 42 });
    listOperationsMock.mockResolvedValueOnce({ items: [known], next: undefined });
    fetchOpsForLedgerMock.mockRejectedValueOnce(new Error("Horizon 500"));

    const result = await operationsFromHeight(ADDRESS, 0);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("tx-out-100");
  });

  it("retries a batch once after a 429, then continues supplementing", async () => {
    const known = makeLegacyOp({ hash: "tx-out", index: "100", height: 42 });
    listOperationsMock.mockResolvedValueOnce({ items: [known], next: undefined });

    const recovered = makePreLegacyOp({ hash: "tx-in", index: "200", height: 42 });
    const horizonRate = new LedgerAPI4xx("status code 4xx", {
      status: 429,
      url: undefined,
      method: "GET",
    });
    fetchOpsForLedgerMock
      .mockRejectedValueOnce(horizonRate)
      .mockResolvedValueOnce([recovered]);

    const result = await operationsFromHeight(ADDRESS, 0);

    // First call 429'd; retry succeeded so we still get the supplemented op.
    expect(fetchOpsForLedgerMock).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.map(o => o.id).sort()).toEqual(["tx-in-200", "tx-out-100"]);
  });

  it("aborts the supplement after two consecutive 429s and returns what it has", async () => {
    const ledgerA = makeLegacyOp({ hash: "tx-a", index: "1", height: 42 });
    const ledgerB = makeLegacyOp({ hash: "tx-b", index: "2", height: 43 });
    const ledgerC = makeLegacyOp({ hash: "tx-c", index: "3", height: 44 });
    listOperationsMock.mockResolvedValueOnce({
      items: [ledgerA, ledgerB, ledgerC],
      next: undefined,
    });

    const horizonRate = new LedgerAPI4xx("status code 4xx", {
      status: 429,
      url: undefined,
      method: "GET",
    });
    // SUPPLEMENT_CONCURRENCY = 2, so the first batch is [seqA, seqB] (whichever
    // two come out of the Set first). Both calls in that batch 429, then the
    // single-batch retry also 429s → abort before issuing a 3rd request.
    fetchOpsForLedgerMock.mockRejectedValue(horizonRate);

    const result = await operationsFromHeight(ADDRESS, 0);

    // First batch (2 reqs) + retry of same batch (2 reqs) = 4 calls. The third
    // ledger is never queried because we aborted.
    expect(fetchOpsForLedgerMock).toHaveBeenCalledTimes(4);
    // Result is the un-supplemented forAccount accumulator.
    expect(result.items.map(o => o.id).sort()).toEqual(["tx-a-1", "tx-b-2", "tx-c-3"]);
  });

  it("sorts the merged result desc by (block height, op id)", async () => {
    const a = makeLegacyOp({ hash: "tx-a", index: "1", height: 42 });
    const c = makeLegacyOp({ hash: "tx-c", index: "3", height: 43 });
    listOperationsMock.mockResolvedValueOnce({ items: [c, a], next: undefined });

    const supplementForH42 = makePreLegacyOp({ hash: "tx-b", index: "2", height: 42 });
    fetchOpsForLedgerMock.mockImplementation(async (seq: number) =>
      seq === 42 ? [supplementForH42] : [],
    );

    const result = await operationsFromHeight(ADDRESS, 0);

    expect(result.items.map(o => o.id)).toEqual(["tx-c-3", "tx-b-2", "tx-a-1"]);
  });
});
