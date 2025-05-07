import { getAccount, executeTransactionBlock } from "../network";
import { SuiClient } from "@mysten/sui/client";

jest.mock("@mysten/sui/client");

const mockBalance = "1000000000";
const mockDigest = "0x1234567890abcdef";
const mockApi = {
  getBalance: jest.fn().mockResolvedValue({ totalBalance: mockBalance }),
  executeTransactionBlock: jest.fn().mockResolvedValue({ digest: mockDigest }),
} as unknown as SuiClient;

(SuiClient as jest.Mock).mockImplementation(() => mockApi);

describe("Network Operations", () => {
  const mockAddress = "0x1234567890abcdef";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccount", () => {
    it("should fetch account information", async () => {
      const result = await getAccount(mockAddress);
      expect(result).toBeDefined();
      expect(mockApi.getBalance).toHaveBeenCalledWith({
        owner: mockAddress,
      });
    });
  });

  describe("executeTransactionBlock", () => {
    it("should execute a transaction block successfully", async () => {
      const result = await executeTransactionBlock({
        transactionBlock: "mockTransaction",
        signature: "mockSignature",
      });

      expect(result).toBeDefined();
      expect(result.digest).toBe(mockDigest);
    });
  });
});
