import { getBalance } from "./getBalance";
import { getNextValidSequence } from "./getNextSequence";

// Mock network calls
jest.mock("../../network/proxyClient", () => ({
  getAccountBalance: jest.fn().mockResolvedValue({
    finalizedBalance: {
      accountAmount: "50000000000",
    },
  }),
  getAccountNonce: jest.fn().mockResolvedValue({
    nonce: 42,
  }),
}));

const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

describe("logic/account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBalance", () => {
    it("should return balance as native asset", async () => {
      const result = await getBalance(VALID_ADDRESS, "concordium_testnet");

      expect(result).toHaveLength(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBe(BigInt("50000000000"));
    });

    it("should call getAccountBalance with correct parameters", async () => {
      const { getAccountBalance } = jest.requireMock("../../network/proxyClient");

      await getBalance(VALID_ADDRESS, "concordium_testnet");

      expect(getAccountBalance).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS);
    });

    it("should handle zero balance", async () => {
      const { getAccountBalance } = jest.requireMock("../../network/proxyClient");
      getAccountBalance.mockResolvedValueOnce({
        finalizedBalance: { accountAmount: "0" },
      });

      const result = await getBalance(VALID_ADDRESS, "concordium_testnet");

      expect(result[0].value).toBe(BigInt(0));
    });

    it("should handle large balances", async () => {
      const { getAccountBalance } = jest.requireMock("../../network/proxyClient");
      getAccountBalance.mockResolvedValueOnce({
        finalizedBalance: { accountAmount: "999999999999999999" },
      });

      const result = await getBalance(VALID_ADDRESS, "concordium_testnet");

      expect(result[0].value).toBe(BigInt("999999999999999999"));
    });

    it("should propagate network errors", async () => {
      const { getAccountBalance } = jest.requireMock("../../network/proxyClient");
      getAccountBalance.mockRejectedValueOnce(new Error("Account not found"));

      await expect(getBalance(VALID_ADDRESS, "concordium_testnet")).rejects.toThrow(
        "Account not found",
      );
    });
  });

  describe("getNextValidSequence", () => {
    it("should return nonce from network", async () => {
      const result = await getNextValidSequence(VALID_ADDRESS, "concordium_testnet");

      expect(result).toBe(42);
    });

    it("should call getAccountNonce with correct parameters", async () => {
      const { getAccountNonce } = jest.requireMock("../../network/proxyClient");

      await getNextValidSequence(VALID_ADDRESS, "concordium_testnet");

      expect(getAccountNonce).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS);
    });

    it("should handle nonce of 0", async () => {
      const { getAccountNonce } = jest.requireMock("../../network/proxyClient");
      getAccountNonce.mockResolvedValueOnce({ nonce: 0 });

      const result = await getNextValidSequence(VALID_ADDRESS, "concordium_testnet");

      expect(result).toBe(0);
    });

    it("should handle large nonce values", async () => {
      const { getAccountNonce } = jest.requireMock("../../network/proxyClient");
      getAccountNonce.mockResolvedValueOnce({ nonce: 999999999 });

      const result = await getNextValidSequence(VALID_ADDRESS, "concordium_testnet");

      expect(result).toBe(999999999);
    });

    it("should propagate network errors", async () => {
      const { getAccountNonce } = jest.requireMock("../../network/proxyClient");
      getAccountNonce.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(getNextValidSequence(VALID_ADDRESS, "concordium_testnet")).rejects.toThrow(
        "Network timeout",
      );
    });
  });
});
