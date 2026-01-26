import { getNodeApi } from "../network/node/index";
import { broadcast } from "./broadcast";

jest.mock("../network/node/index", () => ({
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = getNodeApi as jest.Mock;

describe("EVM broadcast with source", () => {
  const mockCurrency = { id: "ethereum" } as any;
  const mockBroadcastTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue({
      broadcastTransaction: mockBroadcastTransaction,
    });
    mockBroadcastTransaction.mockResolvedValue("0xhash123");
  });

  it("should broadcast with source headers from broadcastConfig", async () => {
    const result = await broadcast(mockCurrency, {
      signature: "0xsignature",
      broadcastConfig: {
        mevProtected: true,
        source: {
          type: "live-app",
          name: "test-manifest-id",
        },
      },
    });

    expect(mockBroadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      "0xsignature",
      expect.objectContaining({
        mevProtected: true,
        source: {
          type: "live-app",
          name: "test-manifest-id",
        },
      }),
    );
    expect(result).toBe("0xhash123");
  });

  it("should broadcast swap transaction with swap source", async () => {
    const result = await broadcast(mockCurrency, {
      signature: "0xsignature",
      broadcastConfig: {
        mevProtected: false,
        sponsored: true,
        source: {
          type: "swap",
          name: "1inch",
        },
      },
    });

    expect(mockBroadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      "0xsignature",
      expect.objectContaining({
        source: {
          type: "swap",
          name: "1inch",
        },
      }),
    );
    expect(result).toBe("0xhash123");
  });

  it("should broadcast without source when not provided", async () => {
    const result = await broadcast(mockCurrency, {
      signature: "0xsignature",
      broadcastConfig: {
        mevProtected: false,
      },
    });

    expect(mockBroadcastTransaction).toHaveBeenCalledWith(
      mockCurrency,
      "0xsignature",
      expect.objectContaining({
        mevProtected: false,
      }),
    );
    expect(result).toBe("0xhash123");
  });
});
