import { BigNumber } from "bignumber.js";
import * as buildTransactionModule from "./buildTransaction";
import { getEstimatedFees } from "./getFeesForTransaction";
import * as network from "./network";
import type { AlgorandAccount, Transaction } from "./types";

jest.mock("./network");
jest.mock("./buildTransaction");

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

const mockBuildTransactionPayload =
  buildTransactionModule.buildTransactionPayload as jest.MockedFunction<
    typeof buildTransactionModule.buildTransactionPayload
  >;

const mockEncodeToSign = buildTransactionModule.encodeToSign as jest.MockedFunction<
  typeof buildTransactionModule.encodeToSign
>;

describe("getFeesForTransaction", () => {
  const mockAccount = {
    freshAddress: "ALGO_ADDRESS",
  } as AlgorandAccount;

  const mockTransaction: Transaction = {
    family: "algorand",
    mode: "send",
    amount: new BigNumber("1000000"),
    recipient: "RECIPIENT_ADDRESS",
    fees: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEstimatedFees", () => {
    it("should return minFee when fee is 0", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 0,
        minFee: 1000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);

      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe("1000");
    });

    it("should calculate fee based on transaction size when fee > 0", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 1, // 1 microAlgo per byte
        minFee: 1000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      // Mock a payload that encodes to 200 bytes
      mockBuildTransactionPayload.mockResolvedValue({} as never);
      mockEncodeToSign.mockReturnValue("a".repeat(400)); // 200 bytes in hex

      const result = await getEstimatedFees(mockAccount, mockTransaction);

      // (200 bytes + 71 signature bytes) * 1 = 271, but min is 1000
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe("1000");
    });

    it("should return calculated fee when higher than minFee", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 10, // 10 microAlgos per byte
        minFee: 1000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      // Mock a payload that encodes to 500 bytes (1000 hex chars)
      mockBuildTransactionPayload.mockResolvedValue({} as never);
      mockEncodeToSign.mockReturnValue("a".repeat(1000)); // 500 bytes

      const result = await getEstimatedFees(mockAccount, mockTransaction);

      // (500 bytes + 71 signature bytes) * 10 = 5710
      expect(result.toString()).toBe("5710");
    });

    it("should fetch transaction params from network", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 0,
        minFee: 2000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      await getEstimatedFees(mockAccount, mockTransaction);

      expect(mockGetTransactionParams).toHaveBeenCalledTimes(1);
    });

    it("should build transaction payload when fee > 0", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 1,
        minFee: 1000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      mockBuildTransactionPayload.mockResolvedValue({} as never);
      mockEncodeToSign.mockReturnValue("abcd");

      await getEstimatedFees(mockAccount, mockTransaction);

      expect(mockBuildTransactionPayload).toHaveBeenCalledWith(mockAccount, mockTransaction);
      expect(mockEncodeToSign).toHaveBeenCalled();
    });

    it("should not build transaction payload when fee is 0", async () => {
      mockGetTransactionParams.mockResolvedValue({
        fee: 0,
        minFee: 1000,
        firstRound: 1000,
        lastRound: 2000,
        genesisHash: "hash",
        genesisID: "mainnet-v1.0",
      });

      await getEstimatedFees(mockAccount, mockTransaction);

      expect(mockBuildTransactionPayload).not.toHaveBeenCalled();
    });

    it("should propagate network errors", async () => {
      mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

      await expect(getEstimatedFees(mockAccount, mockTransaction)).rejects.toThrow("Network error");
    });
  });
});
