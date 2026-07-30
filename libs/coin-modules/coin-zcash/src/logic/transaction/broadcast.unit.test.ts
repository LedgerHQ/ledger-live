/**
 * Tests for the double-spend guard and the gRPC submission it protects. The
 * engine client is mocked: what matters is which outpoints are checked against
 * the explorer, and when the submission is refused.
 */
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { broadcast, assertTransparentInputsUnspent, type TransparentInputs } from "./broadcast";
import { getZCashClient } from "../engineClient";

jest.mock("../engineClient");

const mockGetZCashClient = getZCashClient as jest.MockedFunction<typeof getZCashClient>;

const TXID = "cc".repeat(32);
const PREVOUT_HASH = "ab".repeat(32);
const TX_HEX = "05" + "00".repeat(63);

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
    ).resolves.toBeUndefined();
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
    ).resolves.toBeUndefined();
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
});
