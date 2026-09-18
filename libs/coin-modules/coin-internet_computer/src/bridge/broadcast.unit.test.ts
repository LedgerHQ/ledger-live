import { broadcast } from "./broadcast";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { broadcastTxn, readTransferOutcome } from "../api";

// The ledger's verdict is read by a mock; what is made of it is the real thing.
jest.mock("../api", () => ({
  broadcastTxn: jest.fn(),
  readTransferOutcome: jest.fn(),
  throwIfLedgerTransferRefused: jest.requireActual("../api").throwIfLedgerTransferRefused,
}));

describe("broadcast", () => {
  beforeEach(() => {
    jest.mocked(broadcastTxn).mockReset();
    jest.mocked(readTransferOutcome).mockReset();
  });

  it("returns the operation when transfer reply is Ok", async () => {
    jest.mocked(broadcastTxn).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(readTransferOutcome).mockResolvedValue({ Ok: 42n });

    const result = await broadcast({
      signedOperation: {
        operation: { extra: { memo: 0 } },
        rawData: {
          encodedSignedCallBlob: "00",
          transferRequestIdHex: "ab".repeat(32),
          methodName: "send",
        },
      },
    } as any);

    expect(result).toEqual({ extra: { memo: 0 } });
    expect(broadcastTxn).toHaveBeenCalledTimes(1);
    expect(broadcastTxn).toHaveBeenCalledWith(
      Buffer.from("00", "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    expect(readTransferOutcome).toHaveBeenCalledTimes(1);
    expect(readTransferOutcome).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), "ab".repeat(32));
  });

  it("rejects when transfer reply is Err (e.g. insufficient funds)", async () => {
    jest.mocked(broadcastTxn).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(readTransferOutcome).mockResolvedValue({
      Err: { InsufficientFunds: { balance: { e8s: 0n } } },
    });

    await expect(
      broadcast({
        account: {} as never,
        signedOperation: {
          operation: { extra: { memo: 0 } },
          rawData: {
            encodedSignedCallBlob: "00",
            transferRequestIdHex: "ab".repeat(32),
            methodName: "send",
          },
        },
      } as any),
    ).rejects.toThrow(/InsufficientFunds/);

    expect(broadcastTxn).toHaveBeenCalledTimes(1);
    expect(readTransferOutcome).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), "ab".repeat(32));
  });
});
