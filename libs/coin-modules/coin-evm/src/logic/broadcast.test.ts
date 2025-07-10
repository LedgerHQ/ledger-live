import { getNodeApi } from "../network/node/index";
import { broadcast } from "./broadcast";

jest.mock("../network/node/index", () => ({
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = getNodeApi as jest.Mock;

describe("broadcastLogic", () => {
  const mockCurrency = { id: "ethereum" } as any;
  const mockSignature = "0xabcdef";
  const mockBroadcastConfig = { mevProtection: true } as any;
  const mockBroadcastTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue({
      broadcastTransaction: mockBroadcastTransaction,
    });
  });

  it("should call getNodeApi and broadcastTransaction with correct arguments", async () => {
    mockBroadcastTransaction.mockResolvedValue("txid123");
    const result = await broadcast(mockCurrency, {
      signature: mockSignature,
      broadcastConfig: mockBroadcastConfig,
    });
    expect(mockGetNodeApi).toHaveBeenCalledWith(mockCurrency);
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      mockSignature,
      mockBroadcastConfig,
    );
    expect(result).toBe("txid123");
  });

  it("should propagate errors from broadcastTransaction", async () => {
    mockBroadcastTransaction.mockRejectedValue(new Error("Broadcast failed"));
    await expect(
      broadcast(mockCurrency, {
        signature: mockSignature,
        broadcastConfig: mockBroadcastConfig,
      }),
    ).rejects.toThrow("Broadcast failed");
  });

  it("should handle undefined broadcastConfig", async () => {
    mockBroadcastTransaction.mockResolvedValue("txid456");
    const result = await broadcast(mockCurrency, {
      signature: mockSignature,
      broadcastConfig: undefined,
    });
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(mockCurrency, mockSignature, undefined);
    expect(result).toBe("txid456");
  });

  it("should handle different signature values", async () => {
    mockBroadcastTransaction.mockResolvedValue("txid789");
    const anotherSignature = "0x123456";
    const result = await broadcast(mockCurrency, {
      signature: anotherSignature,
      broadcastConfig: mockBroadcastConfig,
    });
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      anotherSignature,
      mockBroadcastConfig,
    );
    expect(result).toBe("txid789");
  });
});
