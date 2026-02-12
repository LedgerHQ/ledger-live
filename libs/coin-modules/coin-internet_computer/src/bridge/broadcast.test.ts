import { broadcastTxn } from "../api";
import { broadcast } from "./broadcast";

jest.mock("../api", () => ({
  broadcastTxn: jest.fn(),
}));

const mockBroadcastTxn = jest.mocked(broadcastTxn);

describe("broadcast", () => {
  beforeEach(() => {
    mockBroadcastTxn.mockReset();
  });

  it("should broadcast a signed transaction and return the operation", async () => {
    mockBroadcastTxn.mockResolvedValue(new ArrayBuffer(8));

    const operation = {
      id: "op-1",
      hash: "tx-hash",
      extra: { memo: "123" },
    } as any;

    const result = await broadcast({
      signedOperation: {
        operation,
        rawData: {
          encodedSignedCallBlob: "deadbeef",
        },
        signature: "sig",
      },
      account: {} as any,
    });

    expect(result).toBe(operation);
    expect(mockBroadcastTxn).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(String),
      "call",
    );
  });

  it("should throw when rawData has invalid format", async () => {
    const operation = { id: "op-1", extra: { memo: "123" } } as any;
    await expect(
      broadcast({
        signedOperation: {
          operation,
          rawData: {},
          signature: "sig",
        },
        account: {} as any,
      }),
    ).rejects.toThrow();
  });

  it("should throw when operation.extra is missing", async () => {
    const operation = { id: "op-1" } as any;
    await expect(
      broadcast({
        signedOperation: {
          operation,
          rawData: { encodedSignedCallBlob: "deadbeef" },
          signature: "sig",
        },
        account: {} as any,
      }),
    ).rejects.toThrow();
  });
});
