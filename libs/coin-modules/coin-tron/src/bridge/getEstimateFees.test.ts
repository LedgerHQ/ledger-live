import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees, getAccount } from "../logic";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "../logic/constants";
import { Transaction } from "../types";
import getEstimatedFees from "./getEstimateFees";
import { extractBandwidthInfo } from "./utils";

// Mock typed functions
const mockGetAccount = jest.mocked(getAccount);
const mockEstimateFees = jest.mocked(estimateFees);
const mockExtractBandwidthInfo = jest.mocked(extractBandwidthInfo);

jest.mock("./utils", () => ({
  extractBandwidthInfo: jest.fn(),
  getEstimatedBlockSize: jest.fn().mockReturnValue(new BigNumber(200)),
}));

jest.mock("../logic/estimateFees");
jest.mock("../logic/getAccount");

describe("getEstimatedFees", () => {
  const mockAccount = {
    id: "mock-account-id",
    freshAddress: "mock-address",
  } as Account;

  const mockTransaction: Transaction = {
    family: "tron",
    mode: "send",
    resource: "BANDWIDTH",
    networkInfo: {
      family: "tron",
      freeNetUsed: new BigNumber(0),
      freeNetLimit: new BigNumber(500),
      netUsed: new BigNumber(0),
      netLimit: new BigNumber(1000),
      energyUsed: new BigNumber(0),
      energyLimit: new BigNumber(2000),
    },
    duration: null,
    votes: [],
    amount: new BigNumber(1000),
    recipient: "mock-recipient-address",
  };

  const mockTokenAccount: TokenAccount = {
    id: "mock-token-account-id",
    token: {
      id: "mock-token-id",
      contractAddress: "mock-contract-address",
      tokenType: "trc20",
    },
  } as TokenAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFeesFromBandwidth", () => {
    it("should return STANDARD_FEES_NATIVE if bandwidth is insufficient", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(STANDARD_FEES_NATIVE);
    });

    it("should return 0 if bandwidth is sufficient", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(500),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(500),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(new BigNumber(0));
    });
  });

  describe("getFeesFromAccountActivation", () => {
    it("should return ACTIVATION_FEES if recipient account is not active", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(ACTIVATION_FEES);
    });

    it("should return STANDARD_FEES_TRC_20 if recipient has TRC20 balance", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(500),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount);
      expect(result).toEqual(STANDARD_FEES_TRC_20);
    });

    it("should return estimated fees for TRC20 token transfer", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockEstimateFees.mockResolvedValue(1000n);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount);
      expect(result).toEqual(new BigNumber(1000));
    });
  });

  describe("getEstimatedFees", () => {
    it("should prioritize account activation fees over bandwidth fees", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(ACTIVATION_FEES);
    });

    it("should return bandwidth fees if no account activation is required", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(500),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(500),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(new BigNumber(0));
    });
  });
});
