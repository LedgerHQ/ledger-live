import { broadcast } from "./broadcast";
import suiAPI from "../network";

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
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledWith({
        transactionBlock: "1234567890",
        signature: "abcdef",
        options: {
          showEffects: true,
        },
      });
    });
  });

  describe("with ExecuteTransactionBlockParams input", () => {
    it("should directly use provided params", async () => {
      const mockParams = {
        transactionBlock: "test-block",
        signature: "test-signature",
        options: {
          showEffects: true,
        },
      };

      const result = await broadcast(mockParams);

      expect(result).toBe("test-digest");
      expect(suiAPI.executeTransactionBlock).toHaveBeenCalledWith(mockParams);
    });
  });
});
