import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { toBase64 } from "@mysten/sui/utils";
import type { SuiCoinConfig } from "../config";
import { createSuiGrpcClient } from "./grpc/client";
import { getListOperations } from "./sdk";
import {
  executeTransactionGrpc,
  fetchCheckpointDigestsGrpc,
  listTransactionsByAddressGrpc,
  resolveCheckpointForDigestGrpc,
  simulateTransactionGrpc,
} from "./sdk.grpc";

jest.mock("./grpc/transactions", () => ({
  ...jest.requireActual("./grpc/transactions"),
  // The proto→legacy mapping is covered by `grpc/transactions.response.test.ts`; here only the
  // frame draining and request shaping are under test, so frames pass through as-is.
  grpcTxToJsonRpcResponse: jest.fn((tx: Record<string, unknown>) => ({ ...tx })),
}));

jest.mock("./grpc/client", () => ({ createSuiGrpcClient: jest.fn() }));

const TX_BYTES = new Uint8Array([1, 2, 3, 4]);
const ADDRESS = `0x${"0".repeat(63)}a`;
const ADDRESS_CANONICAL = ADDRESS;

const gasUsed = {
  computationCost: "1000",
  storageCost: "2000",
  storageRebate: "500",
  nonRefundableStorageFee: "0",
};

describe("simulateTransactionGrpc", () => {
  const stub = (result: unknown) => {
    const simulateTransaction = jest.fn(() => Promise.resolve(result));
    return {
      api: { core: { simulateTransaction } } as unknown as SuiGrpcClient,
      simulateTransaction,
    };
  };

  it("returns the gas breakdown and the resolved budget", async () => {
    const { api } = stub({
      Transaction: { effects: { gasUsed }, transaction: { gasData: { budget: "8888000" } } },
    });

    await expect(simulateTransactionGrpc(api, TX_BYTES)).resolves.toEqual({
      gasBudget: "8888000",
      computationCost: "1000",
      storageCost: "2000",
      storageRebate: "500",
    });
  });

  // A failed simulation still carries gas effects, and the fee path needs them: `paymentInfo`
  // must show a fee rather than an error when the transaction itself would revert.
  it("reads gas from a failed simulation", async () => {
    const { api } = stub({ FailedTransaction: { effects: { gasUsed }, transaction: {} } });

    await expect(simulateTransactionGrpc(api, TX_BYTES)).resolves.toMatchObject({
      gasBudget: "0",
      computationCost: "1000",
    });
  });

  it("throws when the node returns no gas effects", async () => {
    const { api } = stub({ Transaction: { effects: {} } });

    await expect(simulateTransactionGrpc(api, TX_BYTES)).rejects.toThrow(/no gas effects/);
  });

  // Callers pass base64 (the bridge) or raw bytes (tests and the build path); the Core API takes
  // bytes, so a base64 string must be decoded rather than forwarded.
  it("decodes a base64 transaction before sending it", async () => {
    const { api, simulateTransaction } = stub({
      Transaction: { effects: { gasUsed }, transaction: {} },
    });

    await simulateTransactionGrpc(api, toBase64(TX_BYTES));

    expect(simulateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: TX_BYTES, doGasSelection: false }),
    );
  });
});

describe("executeTransactionGrpc", () => {
  const stub = (result: unknown) => {
    const executeTransaction = jest.fn(() => Promise.resolve(result));
    return {
      api: { core: { executeTransaction } } as unknown as SuiGrpcClient,
      executeTransaction,
    };
  };

  it("reports success with the digest", async () => {
    const { api } = stub({
      Transaction: { digest: "d1", effects: { status: { success: true, error: null } } },
    });

    await expect(executeTransactionGrpc(api, TX_BYTES, ["sig"])).resolves.toEqual({
      digest: "d1",
      status: "success",
    });
  });

  // `logic/broadcast` interpolates `error` into the user-visible failure message, so it must be
  // prose — a stringified object here is what the other transports never produce.
  it("surfaces a failure's message rather than a serialised object", async () => {
    const { api } = stub({
      FailedTransaction: {
        digest: "d2",
        effects: {
          status: {
            success: false,
            error: { message: "MoveAbort in 0x2::coin: 1", $kind: "MoveAbort" },
          },
        },
      },
    });

    await expect(executeTransactionGrpc(api, TX_BYTES, ["sig"])).resolves.toEqual({
      digest: "d2",
      status: "failure",
      error: "MoveAbort in 0x2::coin: 1",
    });
  });

  // A digest alone does not prove execution succeeded, so a response with no status must not be
  // reported as success; the caller turns a missing status into a failure.
  it("omits the status when the response carries none", async () => {
    const { api } = stub({ Transaction: { digest: "d3" } });

    await expect(executeTransactionGrpc(api, TX_BYTES, ["sig"])).resolves.toEqual({ digest: "d3" });
  });

  it("forwards the signatures and decodes base64 bytes", async () => {
    const { api, executeTransaction } = stub({
      Transaction: { digest: "d4", effects: { status: { success: true } } },
    });

    await executeTransactionGrpc(api, toBase64(TX_BYTES), ["sig-a", "sig-b"]);

    expect(executeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: TX_BYTES, signatures: ["sig-a", "sig-b"] }),
    );
  });
});

describe("listTransactionsByAddressGrpc", () => {
  type ListRequest = {
    filter?: {
      terms?: { literals?: { predicate?: { affectedAddress?: { address?: string } } }[] }[];
    };
    options?: { limit?: number; ordering?: number };
    startCheckpoint?: bigint;
    endCheckpoint?: bigint;
  };

  const stub = (frames: unknown[]) => {
    let request: ListRequest | undefined;
    const listTransactions = jest.fn((req: ListRequest) => {
      request = req;
      return {
        responses: (async function* () {
          for (const frame of frames) yield frame;
        })(),
      };
    });
    return {
      api: { ledgerService: { listTransactions } } as unknown as SuiGrpcClient,
      listTransactions,
      sent: () => request as ListRequest,
    };
  };

  it("drains every frame and keeps the last watermark cursor", async () => {
    const cursor = new Uint8Array([9, 9]);
    const { api } = stub([
      { transaction: { digest: "a" } },
      { watermark: { cursor: new Uint8Array([1]) } },
      { transaction: { digest: "b" } },
      { watermark: { cursor } },
    ]);

    const result = await listTransactionsByAddressGrpc(api, {
      address: ADDRESS,
      limit: 50,
      order: "desc",
    });

    expect(result.transactions.map(t => t.digest)).toEqual(["a", "b"]);
    expect(result.cursor).toBe(cursor);
  });

  it("omits the cursor when the stream carries no watermark", async () => {
    const { api } = stub([{ transaction: { digest: "a" } }]);

    const result = await listTransactionsByAddressGrpc(api, {
      address: ADDRESS,
      limit: 50,
      order: "asc",
    });

    expect(result).not.toHaveProperty("cursor");
  });

  // Ordering is an enum on the wire: ASCENDING = 0, DESCENDING = 1. Swapping these would page
  // history in the wrong direction and silently return the oldest transactions as the newest.
  it.each([
    ["asc", 0],
    ["desc", 1],
  ] as const)("maps %s order to ordering %i", async (order, ordering) => {
    const { api, listTransactions } = stub([]);

    await listTransactionsByAddressGrpc(api, { address: ADDRESS, limit: 25, order });

    expect(listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ options: { limit: 25, ordering } }),
    );
  });

  it("normalises the address into the affected-address filter", async () => {
    const { api, sent } = stub([]);

    await listTransactionsByAddressGrpc(api, { address: "0xa", limit: 1, order: "desc" });

    expect(sent().filter?.terms?.[0].literals?.[0].predicate?.affectedAddress?.address).toBe(
      ADDRESS_CANONICAL,
    );
  });

  // Checkpoint bounds are omitted entirely when absent: sending `undefined` would be serialised
  // as a zero bound and silently restrict the page to genesis.
  it("sends only the bounds it was given", async () => {
    const { api, sent } = stub([]);

    await listTransactionsByAddressGrpc(api, {
      address: ADDRESS,
      limit: 1,
      order: "asc",
      startCheckpoint: 42,
    });

    expect(sent().startCheckpoint).toBe(42n);
    expect(sent()).not.toHaveProperty("endCheckpoint");
  });
});

const checkpointFrame = (sequenceNumber: bigint | undefined, digest?: string) => ({
  checkpoint: { sequenceNumber, ...(digest !== undefined && { digest }) },
});

describe("fetchCheckpointDigestsGrpc", () => {
  type ListRequest = {
    filter?: {
      terms?: { literals?: { predicate?: { affectedAddress?: { address?: string } } }[] }[];
    };
    readMask?: { paths?: string[] };
    options?: { limit?: number };
    startCheckpoint?: bigint;
    endCheckpoint?: bigint;
  };

  const stub = (frames: unknown[] | Error) => {
    let request: ListRequest | undefined;
    const listCheckpoints = jest.fn((req: ListRequest) => {
      request = req;
      if (frames instanceof Error) throw frames;
      return {
        responses: (async function* () {
          for (const frame of frames) yield frame;
        })(),
      };
    });
    return {
      api: { ledgerService: { listCheckpoints } } as unknown as SuiGrpcClient,
      listCheckpoints,
      sent: () => request as ListRequest,
    };
  };

  it("maps each checkpoint sequence to its digest", async () => {
    const { api } = stub([checkpointFrame(10n, "cp-10"), checkpointFrame(12n, "cp-12")]);

    const digests = await fetchCheckpointDigestsGrpc(api, {
      address: ADDRESS,
      sequences: [10, 12],
      limit: 50,
    });

    expect(Object.fromEntries(digests)).toEqual({ "10": "cp-10", "12": "cp-12" });
  });

  // A wrong bound would drop the digests for the checkpoints at either end.
  // `end_checkpoint` is exclusive, hence max + 1.
  it("spans the page's checkpoint range with an exclusive upper bound", async () => {
    const { api, sent } = stub([]);

    await fetchCheckpointDigestsGrpc(api, { address: ADDRESS, sequences: [30, 12, 21], limit: 50 });

    expect(sent().startCheckpoint).toBe(12n);
    expect(sent().endCheckpoint).toBe(31n);
    expect(sent().options?.limit).toBe(50);
    expect(sent().readMask?.paths).toEqual(["sequence_number", "digest"]);
  });

  // The filter is what keeps this to one call: without it the stream returns every checkpoint in
  // the range, which for a sparse account is unbounded.
  it("restricts the stream to checkpoints affecting the address", async () => {
    const { api, sent } = stub([]);

    await fetchCheckpointDigestsGrpc(api, { address: "0xa", sequences: [1], limit: 50 });

    expect(sent().filter?.terms?.[0].literals?.[0].predicate?.affectedAddress?.address).toBe(
      ADDRESS_CANONICAL,
    );
  });

  it("skips frames missing a sequence number or a digest", async () => {
    const { api } = stub([
      checkpointFrame(undefined, "orphan"),
      checkpointFrame(7n),
      checkpointFrame(8n, "cp-8"),
    ]);

    const digests = await fetchCheckpointDigestsGrpc(api, {
      address: ADDRESS,
      sequences: [7, 8],
      limit: 50,
    });

    expect(Object.fromEntries(digests)).toEqual({ "8": "cp-8" });
  });

  it("makes no call when there are no sequences to resolve", async () => {
    const { api, listCheckpoints } = stub([]);

    const digests = await fetchCheckpointDigestsGrpc(api, {
      address: ADDRESS,
      sequences: [],
      limit: 50,
    });

    expect(digests.size).toBe(0);
    expect(listCheckpoints).not.toHaveBeenCalled();
  });

  // A lookup failure degrades to the synthetic fallback rather than failing the history page.
  it("returns an empty map when the stream fails", async () => {
    const { api } = stub(new Error("unavailable"));

    const digests = await fetchCheckpointDigestsGrpc(api, {
      address: ADDRESS,
      sequences: [1],
      limit: 50,
    });

    expect(digests.size).toBe(0);
  });
});

describe("resolveCheckpointForDigestGrpc", () => {
  const stub = (impl: () => unknown) => {
    const getTransaction = jest.fn(impl);
    return { api: { ledgerService: { getTransaction } } as unknown as SuiGrpcClient };
  };

  it("returns the checkpoint sequence as a number", async () => {
    const { api } = stub(() =>
      Promise.resolve({ response: { transaction: { checkpoint: 309107352n } } }),
    );

    await expect(resolveCheckpointForDigestGrpc(api, "d1")).resolves.toBe(309107352);
  });

  it("returns null when the transaction carries no checkpoint", async () => {
    const { api } = stub(() => Promise.resolve({ response: { transaction: {} } }));

    await expect(resolveCheckpointForDigestGrpc(api, "d1")).resolves.toBeNull();
  });

  // An unknown digest must not fail the sync: the caller falls back to an unbounded page.
  it("returns null when the lookup throws", async () => {
    const { api } = stub(() => Promise.reject(new Error("not found")));

    await expect(resolveCheckpointForDigestGrpc(api, "nope")).resolves.toBeNull();
  });
});

// The other transports report the real checkpoint digest, so the gRPC arm must too — otherwise
// retiring them would silently downgrade every `blockHash`.
describe("getListOperations on the gRPC transport", () => {
  const tx = (digest: string, checkpoint: string) => ({
    transaction: {
      digest,
      checkpoint,
      timestampMs: "1700000000000",
      effects: { status: { status: "success" }, gasUsed },
    },
  });

  const stubApi = (checkpointFrames: unknown[]) => {
    const listTransactions = jest.fn(() => ({
      responses: (async function* () {
        yield tx("tx-a", "10");
        yield tx("tx-b", "12");
      })(),
    }));
    const listCheckpoints = jest.fn(() => ({
      responses: (async function* () {
        for (const frame of checkpointFrames) yield frame;
      })(),
    }));
    (createSuiGrpcClient as unknown as jest.Mock).mockReturnValue({
      ledgerService: { listTransactions, listCheckpoints },
    });
    return { listCheckpoints };
  };

  const grpcConfig = {
    node: {
      url: "https://json-rpc.example.test",
      graphqlUrl: "https://graphql.example.test/graphql",
      grpcUrl: "https://grpc.example.test",
    },
    status: { type: "active" },
    features: { transport: "grpc" },
  } as unknown as SuiCoinConfig;

  beforeEach(() => {
    (createSuiGrpcClient as unknown as jest.Mock).mockReset();
  });

  it("reports the real checkpoint digest as the block hash", async () => {
    stubApi([
      { checkpoint: { sequenceNumber: 10n, digest: "cp-10" } },
      { checkpoint: { sequenceNumber: 12n, digest: "cp-12" } },
    ]);

    const page = await getListOperations(grpcConfig, ADDRESS, "desc", undefined, undefined);

    expect(page.items.map(op => op.tx.block.hash)).toEqual(["cp-12", "cp-10"]);
  });

  it("falls back to a synthetic hash for a checkpoint the stream did not return", async () => {
    stubApi([{ checkpoint: { sequenceNumber: 10n, digest: "cp-10" } }]);

    const page = await getListOperations(grpcConfig, ADDRESS, "desc", undefined, undefined);

    expect(page.items.map(op => op.tx.block.hash)).toEqual(["synthetic-12", "cp-10"]);
  });

  it("resolves the digests in a single call for the whole page", async () => {
    const { listCheckpoints } = stubApi([
      { checkpoint: { sequenceNumber: 10n, digest: "cp-10" } },
      { checkpoint: { sequenceNumber: 12n, digest: "cp-12" } },
    ]);

    await getListOperations(grpcConfig, ADDRESS, "desc", undefined, undefined);

    expect(listCheckpoints).toHaveBeenCalledTimes(1);
  });
});

// Guards the invariant documented on `dropOperationsBeforeCursor`: a page boundary can fall inside a
// checkpoint, so the server bound must keep that checkpoint in range.
describe("getListOperations cursor bounds on the gRPC transport", () => {
  const TS = 1700000000000;

  // Transactions in one checkpoint share its `timestampMs`, so the cursor comparison falls through
  // to the digest tie-break — which is what these fixtures exercise.
  const txFrame = (digest: string, checkpoint: string, timestampMs: number = TS) => ({
    transaction: {
      digest,
      checkpoint,
      timestampMs: String(timestampMs),
      effects: { status: { status: "success" }, gasUsed },
    },
  });

  /** `pages` is consumed one `listTransactions` call at a time, so a retry sees the next page. */
  const stubApi = (pages: unknown[][], cursorCheckpoint: bigint | undefined) => {
    const requests: { startCheckpoint?: bigint; endCheckpoint?: bigint }[] = [];
    let call = 0;
    const listTransactions = jest.fn(
      (req: { startCheckpoint?: bigint; endCheckpoint?: bigint }) => {
        requests.push(req);
        const frames = pages[Math.min(call++, pages.length - 1)];
        return {
          responses: (async function* () {
            for (const frame of frames) yield frame;
          })(),
        };
      },
    );
    const getTransaction = jest.fn(() => ({
      response: { transaction: { checkpoint: cursorCheckpoint } },
    }));
    (createSuiGrpcClient as unknown as jest.Mock).mockReturnValue({
      ledgerService: {
        listTransactions,
        getTransaction,
        listCheckpoints: jest.fn(() => ({
          responses: (async function* () {
            /* digests resolve to the synthetic fallback; not under test here */
          })(),
        })),
      },
    });
    return { listTransactions, requests };
  };

  const grpcConfig = {
    node: {
      url: "https://json-rpc.example.test",
      graphqlUrl: "https://graphql.example.test/graphql",
      grpcUrl: "https://grpc.example.test",
    },
    status: { type: "active" },
    features: { transport: "grpc" },
  } as unknown as SuiCoinConfig;

  beforeEach(() => {
    (createSuiGrpcClient as unknown as jest.Mock).mockReset();
  });

  it("keeps the cursor's own checkpoint in range when descending", async () => {
    const { requests } = stubApi([[txFrame("tx-m", "12"), txFrame("tx-a", "12")]], 12n);

    const page = await getListOperations(grpcConfig, ADDRESS, "desc", undefined, `${TS}:tx-m`);

    // `endCheckpoint` is exclusive, so 13 is what keeps checkpoint 12 in range.
    expect(requests[0].endCheckpoint).toBe(13n);
    // The sibling that shared the cursor's checkpoint is returned rather than skipped.
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-a"]);
  });

  it("keeps the cursor's own checkpoint in range when ascending", async () => {
    const { requests } = stubApi([[txFrame("tx-a", "12"), txFrame("tx-m", "12")]], 12n);

    const page = await getListOperations(grpcConfig, ADDRESS, "asc", undefined, `${TS}:tx-a`);

    // `startCheckpoint` is inclusive, so 12 itself is the bound.
    expect(requests[0].startCheckpoint).toBe(12n);
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-m"]);
  });

  it("steps past the cursor's checkpoint when a full page of it is already seen", async () => {
    // A whole page from checkpoint 12, every item at-or-before the cursor: nothing survives the
    // drop, so a second request must move the bound rather than return an empty page.
    const stalled = Array.from({ length: 50 }, (_, i) =>
      txFrame(`tx-${String(i + 1).padStart(3, "0")}`, "12"),
    );
    const { requests } = stubApi([stalled, [txFrame("tx-older", "11", TS - 1000)]], 12n);

    const page = await getListOperations(grpcConfig, ADDRESS, "desc", undefined, `${TS}:tx-000`);

    expect(requests).toHaveLength(2);
    expect(requests[0].endCheckpoint).toBe(13n);
    expect(requests[1].endCheckpoint).toBe(12n);
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-older"]);
  });

  it("does not retry when the page still yields unseen operations", async () => {
    const { requests } = stubApi([[txFrame("tx-m", "12"), txFrame("tx-a", "12")]], 12n);

    await getListOperations(grpcConfig, ADDRESS, "desc", undefined, `${TS}:tx-m`);

    expect(requests).toHaveLength(1);
  });

  it("falls back to an unbounded page when the cursor digest is unknown", async () => {
    const { requests } = stubApi([[txFrame("tx-a", "10")]], undefined);

    await getListOperations(grpcConfig, ADDRESS, "desc", undefined, `${TS}:tx-missing`);

    expect(requests[0]).not.toHaveProperty("endCheckpoint");
    expect(requests[0]).not.toHaveProperty("startCheckpoint");
  });
});
