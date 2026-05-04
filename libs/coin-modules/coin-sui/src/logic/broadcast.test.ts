import suiAPI from "../network";
import { broadcast } from "./broadcast";

// Mock the suiAPI
jest.mock("../network", () => ({
  __esModule: true,
  default: {
    executeTransactionBlock: jest.fn().mockResolvedValue({ digest: "test-digest" }),
  },
}));

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with string input", () => {
    it("should correctly extract transaction and signature and broadcast", async () => {
      // Mock transaction string with 4-byte length prefix
      // Example: "0010" (length 16 in hex) + "1234567890" (raw tx) + "abcdef" (signature)
      const mockTransaction = "000a1234567890abcdef";

      const result = await broadcast(mockTransaction);

      expect(result).toBe("test-digest");
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledWith(
        {
          transactionBlock: "1234567890",
          signature: "abcdef",
          options: {
            showEffects: true,
          },
        },
        undefined,
      );
    });

    it("should not call executeTransactionBlock if format is not hex", async () => {
      const mockTransaction = "000g1234567890abcdef";

      await expect(broadcast(mockTransaction)).rejects.toThrow(
        "sui: invalid serialized transaction payload for broadcast",
      );
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledTimes(0);
    });

    it("should not call executeTransactionBlock if format is incorrect", async () => {
      const mockTransaction = "000a1";

      await expect(broadcast(mockTransaction)).rejects.toThrow(
        "sui: invalid serialized transaction payload for broadcast",
      );
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledTimes(0);
    });
  });

  describe("with ExecuteTransactionBlockParams input", () => {
    it("should forward params with showEffects forced so execution status is always available", async () => {
      const mockParams = {
        transactionBlock: "test-block",
        signature: "test-signature",
        options: {
          showInput: true,
          showEffects: false,
        },
      };

      const result = await broadcast(mockParams);

      expect(result).toBe("test-digest");
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledWith(
        {
          transactionBlock: "test-block",
          signature: "test-signature",
          options: {
            showInput: true,
            showEffects: true,
          },
        },
        undefined,
      );
    });

    it("should throw when executeTransactionBlock returns no digest", async () => {
      const mockParams = {
        transactionBlock: "test-block",
        signature: "test-signature",
        options: {
          showEffects: true,
        },
      };

      jest.mocked(suiAPI.executeTransactionBlock).mockResolvedValueOnce(
        // @ts-expect-error digest omitted on purpose (LIVE-27548 empty-response guard)
        {},
      );

      await expect(broadcast(mockParams)).rejects.toThrow(
        "sui: broadcast returned no transaction digest",
      );
    });

    it("should throw when RPC returns digest but execution status is failure", async () => {
      const mockParams = {
        transactionBlock: "test-block",
        signature: "test-signature",
        options: {
          showEffects: true,
        },
      };

      jest.mocked(suiAPI.executeTransactionBlock).mockResolvedValueOnce({
        digest: "4fwBGMM9Nfc8rbiGfcn7469cvrqetYgik6pLiVCYg4Ud",
        effects: {
          status: {
            status: "failure",
            error: "InsufficientCoinBalance in command 0",
          },
        },
      } as Awaited<ReturnType<typeof suiAPI.executeTransactionBlock>>);

      await expect(broadcast(mockParams)).rejects.toThrow(
        "sui: broadcast execution failed: InsufficientCoinBalance in command 0",
      );
    });
  });
});
