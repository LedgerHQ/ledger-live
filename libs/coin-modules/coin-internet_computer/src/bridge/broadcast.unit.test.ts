import { broadcast } from "./broadcast";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { broadcastTxn, ensureTransferCallAccepted } from "../api";

jest.mock("../api", () => ({
  broadcastTxn: jest.fn(),
  ensureTransferCallAccepted: jest.fn(),
}));

describe("broadcast", () => {
  beforeEach(() => {
    jest.mocked(broadcastTxn).mockReset();
    jest.mocked(ensureTransferCallAccepted).mockReset();
  });

  it("returns the operation when transfer reply is Ok", async () => {
    jest.mocked(broadcastTxn).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(ensureTransferCallAccepted).mockResolvedValue(undefined);

    const result = await broadcast({
      signedOperation: {
        operation: { extra: { memo: 0 } },
        rawData: { encodedSignedCallBlob: "00", transferRequestIdHex: "ab".repeat(32) },
      },
    } as any);

    expect(result).toEqual({ extra: { memo: 0 } });
    expect(broadcastTxn).toHaveBeenCalledTimes(1);
    expect(broadcastTxn).toHaveBeenCalledWith(
      Buffer.from("00", "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    expect(ensureTransferCallAccepted).toHaveBeenCalledTimes(1);
    expect(ensureTransferCallAccepted).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3]),
      "ab".repeat(32),
    );
  });

  it("rejects when transfer reply is Err (e.g. insufficient funds)", async () => {
    jest.mocked(broadcastTxn).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest
      .mocked(ensureTransferCallAccepted)
      .mockRejectedValue(
        new Error(
          'Failed to broadcast transaction: {"InsufficientFunds":{"balance":{"e8s":"0"},"requested":{"e8s":"1"}}}',
        ),
      );

    await expect(
      broadcast({
        account: {} as never,
        signedOperation: {
          operation: { extra: { memo: 0 } },
          rawData: { encodedSignedCallBlob: "00", transferRequestIdHex: "ab".repeat(32) },
        },
      } as any),
    ).rejects.toThrow(/InsufficientFunds/);

    expect(broadcastTxn).toHaveBeenCalledTimes(1);
    expect(ensureTransferCallAccepted).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3]),
      "ab".repeat(32),
    );
  });
});
