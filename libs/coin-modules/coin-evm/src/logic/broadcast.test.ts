import { getNodeApi } from "../network/node/index";
import { mockNodeApi } from "../network/node/node.fixtures";
import { broadcast } from "./broadcast";

jest.mock("../network/node/index", () => ({
  ...jest.requireActual("../network/node/index"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("broadcastLogic", () => {
  const nodeApiMock = mockNodeApi();
  const mockCurrency = { id: "ethereum" } as any;
  const mockSignature = "0xabcdef";
  const mockBroadcastConfig = { mevProtection: true } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue(nodeApiMock);
  });

  it("should call getNodeApi and broadcastTransaction with correct arguments", async () => {
    nodeApiMock.broadcastTransaction.mockResolvedValue("txid123");
    const result = await broadcast(mockCurrency, {
      signature: mockSignature,
      broadcastConfig: mockBroadcastConfig,
    });
    expect(mockGetNodeApi).toHaveBeenCalledWith(mockCurrency);
    expect(nodeApiMock.broadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      mockSignature,
      mockBroadcastConfig,
    );
    expect(result).toBe("txid123");
  });

  it("should propagate errors from broadcastTransaction", async () => {
    nodeApiMock.broadcastTransaction.mockRejectedValue(new Error("Broadcast failed"));
    await expect(
      broadcast(mockCurrency, {
        signature: mockSignature,
        broadcastConfig: mockBroadcastConfig,
      }),
    ).rejects.toThrow("Broadcast failed");
  });

  it("should handle undefined broadcastConfig", async () => {
    nodeApiMock.broadcastTransaction.mockResolvedValue("txid456");
    const result = await broadcast(mockCurrency, {
      signature: mockSignature,
      broadcastConfig: undefined,
    });
    expect(nodeApiMock.broadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      mockSignature,
      undefined,
    );
    expect(result).toBe("txid456");
  });

  it("should handle different signature values", async () => {
    nodeApiMock.broadcastTransaction.mockResolvedValue("txid789");
    const anotherSignature = "0x123456";
    const result = await broadcast(mockCurrency, {
      signature: anotherSignature,
      broadcastConfig: mockBroadcastConfig,
    });
    expect(nodeApiMock.broadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      anotherSignature,
      mockBroadcastConfig,
    );
    expect(result).toBe("txid789");
  });
});
