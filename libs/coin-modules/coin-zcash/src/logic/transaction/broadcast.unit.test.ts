/**
 * Tests for the double-spend guard and the gRPC submission it protects. The
 * engine client is mocked: what matters is which outpoints are checked against
 * the explorer, and when the submission is refused.
 */
import { log } from "@ledgerhq/logs";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { broadcast, assertTransparentInputsUnspent, type TransparentInputs } from "./broadcast";
import { getZCashClient } from "../engineClient";
import { setZainoGrpcUrl } from "../../constants";

jest.mock("../engineClient");
jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const mockGetZCashClient = getZCashClient as jest.MockedFunction<typeof getZCashClient>;
const mockLog = log as jest.MockedFunction<typeof log>;

const TXID = "cc".repeat(32);
const PREVOUT_HASH = "ab".repeat(32);
// Distinctive (not a run of "00") so the merge-gate test below can't pass by
// coincidentally matching some unrelated zero-padded value in a log line.
const TX_HEX = "05" + "ab".repeat(63);

type ExplorerOutput = { output_index: number; spent_at_height?: number | null };

const broadcastTransaction = jest.fn();

function explorer(
  outputsByHash: Record<string, ExplorerOutput[]>,
): TransparentInputs["fetchUtxoTx"] {
  return jest.fn(async (hash: string) => {
    const outputs = outputsByHash[hash];
    if (!outputs) throw new Error("not found");
    return { outputs };
  });
}

afterEach(() => setZainoGrpcUrl(null));

beforeEach(() => {
  jest.clearAllMocks();
  broadcastTransaction.mockResolvedValue(TXID);
  mockGetZCashClient.mockResolvedValue({
    broadcastTransaction,
  } as unknown as Awaited<ReturnType<typeof getZCashClient>>);
});

describe("assertTransparentInputsUnspent", () => {
  it("passes when every outpoint is still unspent", async () => {
    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
        fetchUtxoTx: explorer({ [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: null }] }),
      }),
    ).resolves.toBe(undefined);
  });

  it("refuses an outpoint spent at a confirmed height", async () => {
    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
        fetchUtxoTx: explorer({
          [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: 3_000_100 }],
        }),
      }),
    ).rejects.toThrow(InvalidTransactionError);
  });

  it("only looks at the outputs about to be spent", async () => {
    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 1 }],
        fetchUtxoTx: explorer({
          [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: 3_000_100 }, { output_index: 1 }],
        }),
      }),
    ).resolves.toBe(undefined);
  });

  it("refuses when the source transaction cannot be fetched", async () => {
    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
        fetchUtxoTx: explorer({}),
      }),
    ).rejects.toThrow("tx not found");
  });

  it("fetches each source transaction once, whatever the number of outpoints", async () => {
    const fetchUtxoTx = explorer({
      [PREVOUT_HASH]: [{ output_index: 0 }, { output_index: 1 }],
    });

    await assertTransparentInputsUnspent({
      inputRefs: [
        { hash: PREVOUT_HASH, outputIndex: 0 },
        { hash: PREVOUT_HASH, outputIndex: 1 },
      ],
      fetchUtxoTx,
    });

    expect(fetchUtxoTx).toHaveBeenCalledTimes(1);
  });

  it("logs the offending outpoint when refusing an already-spent input", async () => {
    mockLog.mockClear();

    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
        fetchUtxoTx: explorer({
          [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: 3_000_100 }],
        }),
      }),
    ).rejects.toThrow(InvalidTransactionError);

    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcast guard: refusing already-spent transparent input",
      { hash: PREVOUT_HASH, outputIndex: 0 },
    );
  });

  it("logs the hash when the source transaction cannot be fetched", async () => {
    mockLog.mockClear();

    await expect(
      assertTransparentInputsUnspent({
        inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
        fetchUtxoTx: explorer({}),
      }),
    ).rejects.toThrow("tx not found");

    expect(mockLog).toHaveBeenCalledWith("zcash", "broadcast guard: source transaction not found", {
      hash: PREVOUT_HASH,
    });
  });
});

describe("broadcast", () => {
  it("submits the transaction hex and returns the txid", async () => {
    await expect(broadcast(TX_HEX)).resolves.toBe(TXID);
    expect(broadcastTransaction).toHaveBeenCalledWith(expect.any(String), TX_HEX);
  });

  it("guards the transparent outpoints before submitting", async () => {
    const fetchUtxoTx = explorer({
      [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: 3_000_100 }],
    });

    await expect(
      broadcast(TX_HEX, { inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }], fetchUtxoTx }),
    ).rejects.toThrow("utxos already spent");
    expect(broadcastTransaction).not.toHaveBeenCalled();
  });

  it("submits once the outpoints check out", async () => {
    const fetchUtxoTx = explorer({ [PREVOUT_HASH]: [{ output_index: 0 }] });

    await expect(
      broadcast(TX_HEX, { inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }], fetchUtxoTx }),
    ).resolves.toBe(TXID);
  });

  it("has nothing to check for a fully shielded send", async () => {
    const fetchUtxoTx = explorer({});

    await expect(broadcast(TX_HEX, { inputRefs: [], fetchUtxoTx })).resolves.toBe(TXID);
    expect(fetchUtxoTx).not.toHaveBeenCalled();
  });

  it("refuses when the environment cannot broadcast", async () => {
    mockGetZCashClient.mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof getZCashClient>>,
    );

    await expect(broadcast(TX_HEX)).rejects.toThrow("not supported in this environment");
  });

  it("logs the endpoint and outcome, on both success and failure", async () => {
    await broadcast(TX_HEX);
    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcasting transaction",
      expect.objectContaining({ endpoint: expect.any(String), sizeBytes: TX_HEX.length / 2 }),
    );
    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcast succeeded",
      expect.objectContaining({ txid: TXID }),
    );

    mockLog.mockClear();
    broadcastTransaction.mockRejectedValueOnce(new Error("gRPC rejected"));
    await expect(broadcast(TX_HEX)).rejects.toThrow("gRPC rejected");
    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcast failed",
      expect.objectContaining({ error: "gRPC rejected" }),
    );
  });

  it("keeps the reason but strips a digest-length hex run from it", async () => {
    mockLog.mockClear();
    broadcastTransaction.mockRejectedValueOnce(new Error(`rejected ${TXID}: fee too low`));

    await expect(broadcast(TX_HEX)).rejects.toThrow();

    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcast failed",
      expect.objectContaining({ error: "rejected [hex redacted]: fee too low" }),
    );
  });

  it("attaches the endpoint to the thrown error, surviving past this call site", async () => {
    broadcastTransaction.mockRejectedValueOnce(new Error("gRPC rejected"));

    await expect(broadcast(TX_HEX)).rejects.toMatchObject({ endpoint: expect.any(String) });
  });

  // setZainoGrpcUrl lets a caller point this at a custom or local node, so
  // nothing guarantees the endpoint never carries userinfo or a query/path
  // token -- every log line and the error context must only ever see the
  // sanitized (origin-only) form.
  it("sanitizes the endpoint everywhere it's logged or attached, on success and failure", async () => {
    setZainoGrpcUrl("https://user:secret@my-node.example/token/abc123?token=abc123");

    await broadcast(TX_HEX);
    for (const call of mockLog.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("secret");
      expect(JSON.stringify(call)).not.toContain("abc123");
    }
    expect(mockLog).toHaveBeenCalledWith(
      "zcash",
      "broadcast succeeded",
      expect.objectContaining({ endpoint: "https://my-node.example" }),
    );

    mockLog.mockClear();
    broadcastTransaction.mockRejectedValueOnce(new Error("gRPC rejected"));
    await expect(broadcast(TX_HEX)).rejects.toMatchObject({
      endpoint: "https://my-node.example",
    });
    for (const call of mockLog.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("secret");
      expect(JSON.stringify(call)).not.toContain("abc123");
    }
  });

  // Merge gate: the broadcast path must never log the transaction hex (or a
  // slice of it long enough to be a de-facto digest) -- only metadata about it.
  // Covers both outcomes: a passing-guard success never touched the hex to
  // begin with, but the failure path logs `error.message`, which can be an
  // arbitrary, server-controlled string (client.broadcastTransaction's own
  // rejection) -- the case this gate actually exists to catch.
  it.each([
    ["success", () => broadcastTransaction.mockResolvedValueOnce(TXID)],
    ["failure", () => broadcastTransaction.mockRejectedValueOnce(new Error(`rejected: ${TX_HEX}`))],
  ])("never logs the raw transaction hex (%s)", async (_case, arrange) => {
    mockLog.mockClear();
    arrange();

    await broadcast(TX_HEX, {
      inputRefs: [{ hash: PREVOUT_HASH, outputIndex: 0 }],
      fetchUtxoTx: explorer({ [PREVOUT_HASH]: [{ output_index: 0, spent_at_height: null }] }),
    }).catch(() => {});

    for (const call of mockLog.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(TX_HEX);
    }
  });
});
