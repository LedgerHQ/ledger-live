import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees, getAccount } from "../logic";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "../logic/constants";
import { computeBandwidthFee, computeEnergyFee, estimateEnergy } from "../logic/estimateFees";
import { getChainParameters, getTronAccountNetwork } from "../network";
import type { ChainParameters } from "../network/types";
import type { Transaction } from "../types";
import getEstimatedFees, { getFeeResourceBreakdown } from "./getEstimateFees";
import { extractBandwidthInfo } from "./utils";

// Mock typed functions
const mockGetAccount = jest.mocked(getAccount);
const mockEstimateFees = jest.mocked(estimateFees);
const mockExtractBandwidthInfo = jest.mocked(extractBandwidthInfo);
const mockEstimateEnergy = jest.mocked(estimateEnergy);
const mockComputeBandwidthFee = jest.mocked(computeBandwidthFee);
const mockComputeEnergyFee = jest.mocked(computeEnergyFee);
const mockGetChainParameters = jest.mocked(getChainParameters);
const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);

jest.mock("./utils", () => ({
  extractBandwidthInfo: jest.fn(),
  getEstimatedBlockSize: jest.fn().mockReturnValue(new BigNumber(200)),
}));

jest.mock("../logic/estimateFees");
jest.mock("../logic/getAccount");
jest.mock("../network");

const chainParams: ChainParameters = {
  energyFee: 210,
  transactionFee: 1000,
  createAccountFee: 100_000,
  createNewAccountFeeInSystemContract: 1_000_000,
};

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

  const activeRecipient = { address: "mock-recipient-address", trc20: [] };

  const sufficientBandwidth = {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(500),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(500),
  };

  const insufficientBandwidth = {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockComputeBandwidthFee.mockReturnValue(new BigNumber(0));
    mockComputeEnergyFee.mockReturnValue(new BigNumber(0));
  });

  describe("getFeesFromBandwidth", () => {
    it("should return STANDARD_FEES_NATIVE if bandwidth is insufficient", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(STANDARD_FEES_NATIVE);
    });

    it("should return 0 if bandwidth is sufficient", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(new BigNumber(0));
    });

    it("clamps each bucket independently: a negative free remainder does not mask sufficient staked bandwidth", async () => {
      mockGetAccount.mockResolvedValue([{ address: "mock-contract-address", trc20: [] }]);
      // free bucket is negative (used 600 > limit 500); staked/gained alone (250) covers the 200 cost.
      // Unclamped this sums to 150 < 200 and would wrongly charge; clamped it is 0 + 250 = 250.
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(600),
        freeLimit: new BigNumber(500),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(250),
      });

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(new BigNumber(0));
    });
  });

  describe("getFeesFromAccountActivation", () => {
    it("should return ACTIVATION_FEES if recipient account is not active", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(ACTIVATION_FEES);
    });

    it("should return estimated fees for TRC20 token transfer to a new recipient", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockEstimateFees.mockResolvedValue(1000n);
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount);
      expect(result).toEqual(new BigNumber(1000));
    });

    it("inactive-recipient TRC20 with sufficient bandwidth keeps the flat constant (energy-aware only for active recipients)", async () => {
      mockGetAccount.mockResolvedValue([]); // recipient not active
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount);

      expect(result).toEqual(STANDARD_FEES_TRC_20);
      expect(mockEstimateEnergy).not.toHaveBeenCalled();
      expect(mockGetChainParameters).not.toHaveBeenCalled();
    });
  });

  describe("getEstimatedFees", () => {
    it("should prioritize account activation fees over bandwidth fees", async () => {
      mockGetAccount.mockResolvedValue([]);
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(ACTIVATION_FEES);
    });

    it("should return bandwidth fees if no account activation is required", async () => {
      mockGetAccount.mockResolvedValue([activeRecipient]);
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);

      const result = await getEstimatedFees(mockAccount, mockTransaction);
      expect(result).toEqual(new BigNumber(0));
    });
  });

  describe("native TRX / TRC10 sends (regression, no energy dimension)", () => {
    it("native TRX send never triggers energy simulation and energyRequired is 0", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);

      const breakdown = await getFeeResourceBreakdown(mockAccount, mockTransaction, null);

      expect(breakdown.energyRequired).toEqual(new BigNumber(0));
      expect(mockEstimateEnergy).not.toHaveBeenCalled();
    });

    it("TRC10 sub-account send never triggers energy simulation, fee unchanged", async () => {
      const trc10Account: TokenAccount = {
        id: "mock-trc10-account-id",
        token: {
          id: "mock-trc10-token-id",
          contractAddress: "mock-trc10-contract-address",
          tokenType: "trc10",
        },
      } as TokenAccount;
      mockGetAccount.mockResolvedValue([activeRecipient]);
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);

      const breakdown = await getFeeResourceBreakdown(mockAccount, mockTransaction, trc10Account);
      const fee = await getEstimatedFees(mockAccount, mockTransaction, trc10Account, breakdown);

      expect(breakdown.energyRequired).toEqual(new BigNumber(0));
      expect(mockEstimateEnergy).not.toHaveBeenCalled();
      expect(fee).toEqual(new BigNumber(0));
    });

    it("clamps available energy/bandwidth to zero when the node reports used > limit", async () => {
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(100),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      });
      const tx: Transaction = {
        ...mockTransaction,
        networkInfo: {
          ...mockTransaction.networkInfo!,
          energyLimit: new BigNumber(0),
          energyUsed: new BigNumber(100),
        },
      };

      const breakdown = await getFeeResourceBreakdown(mockAccount, tx, null);

      expect(breakdown.bandwidthAvailable).toEqual(new BigNumber(0));
      expect(breakdown.energyAvailable).toEqual(new BigNumber(0));
    });

    it("clamps each bandwidth bucket independently (negative free does not reduce gained)", async () => {
      mockExtractBandwidthInfo.mockReturnValue({
        freeUsed: new BigNumber(500),
        freeLimit: new BigNumber(0), // free = -500 → 0
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(1000), // gained = 1000
      });

      const breakdown = await getFeeResourceBreakdown(mockAccount, mockTransaction, null);

      // 0 (free) + 1000 (gained), not max(0, -500 + 1000) = 500.
      expect(breakdown.bandwidthAvailable).toEqual(new BigNumber(1000));
    });
  });

  describe("TRC20 active recipient — energy-aware fee (getFeeResourceBreakdown + getEstimatedFees)", () => {
    beforeEach(() => {
      mockGetAccount.mockResolvedValue([activeRecipient]);
    });

    it("handles a large TRC20 amount without an exponential-notation BigInt error", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(1000);
      // 1e22 base units — BigNumber#toString() would render this as "1e+22", which BigInt() rejects.
      const largeAmountTx: Transaction = { ...mockTransaction, amount: new BigNumber("1e22") };

      const breakdown = await getFeeResourceBreakdown(mockAccount, largeAmountTx, mockTokenAccount);

      expect(breakdown.energyEstimated).toBe(true);
      expect(breakdown.energyRequired).toEqual(new BigNumber(1000));
    });

    it("simulates with the token balance for send-max (useAllAmount), not a 0-amount transfer", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(1000);
      const maxTx: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: true,
      };
      const tokenWithBalance = { ...mockTokenAccount, balance: new BigNumber(500) } as TokenAccount;

      await getFeeResourceBreakdown(mockAccount, maxTx, tokenWithBalance);

      expect(mockEstimateEnergy).toHaveBeenCalledWith(expect.objectContaining({ amount: 500n }));
    });

    it("non-send mode with a TRC20 sub-account does not run the energy simulation", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      const freezeTx: Transaction = { ...mockTransaction, mode: "freeze" };

      const breakdown = await getFeeResourceBreakdown(mockAccount, freezeTx, mockTokenAccount);

      expect(mockEstimateEnergy).not.toHaveBeenCalled();
      expect(breakdown.energyRequired).toEqual(new BigNumber(0));
    });

    it("zero-amount send skips the energy simulation (headed for an amount-required error)", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      const zeroAmountTx: Transaction = { ...mockTransaction, amount: new BigNumber(0) };

      const breakdown = await getFeeResourceBreakdown(mockAccount, zeroAmountTx, mockTokenAccount);

      expect(mockEstimateEnergy).not.toHaveBeenCalled();
      expect(breakdown.energyRequired).toEqual(new BigNumber(0));
      expect(breakdown.energyEstimated).toBe(true);
    });

    it("sufficient energy and bandwidth -> fee is 0 (State A)", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(1000);

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        mockTransaction,
        mockTokenAccount,
      );
      const fee = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount, breakdown);

      expect(breakdown.energyEstimated).toBe(true);
      expect(breakdown.energyRequired).toEqual(new BigNumber(1000));
      expect(breakdown.energyRequired.lte(breakdown.energyAvailable)).toBe(true);
      expect(breakdown.bandwidthRequired.lte(breakdown.bandwidthAvailable)).toBe(true);
      expect(fee).toEqual(new BigNumber(0));
    });

    it("insufficient energy -> fee is computeBandwidthFee + computeEnergyFee", async () => {
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(31_895);
      mockComputeBandwidthFee.mockReturnValue(new BigNumber(200_000));
      mockComputeEnergyFee.mockReturnValue(new BigNumber(6_697_950));

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        mockTransaction,
        mockTokenAccount,
      );
      const fee = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount, breakdown);

      expect(breakdown.energyRequired.gt(breakdown.energyAvailable)).toBe(true);
      expect(fee).toEqual(new BigNumber(200_000).plus(6_697_950));
      expect(mockComputeBandwidthFee).toHaveBeenCalledWith(
        breakdown.bandwidthRequired.toNumber(),
        breakdown.networkInfo,
        chainParams,
      );
      expect(mockComputeEnergyFee).toHaveBeenCalledWith(
        breakdown.energyRequired.toNumber(),
        breakdown.networkInfo,
        chainParams,
      );
    });

    it("insufficient resources -> fee equals the REAL (unmocked) computeBandwidthFee + computeEnergyFee math", async () => {
      // End-to-end: exercise the real fee helpers (not the summation-only mocks above) so the actual
      // shortfall subtraction and rate multiplication are proven, not just the wiring.
      const actual = jest.requireActual("../logic/estimateFees");
      mockComputeBandwidthFee.mockImplementation(actual.computeBandwidthFee);
      mockComputeEnergyFee.mockImplementation(actual.computeEnergyFee);

      // Zero available bandwidth AND energy so both dimensions are a full shortfall.
      const zero = new BigNumber(0);
      const emptyNetworkInfo = {
        family: "tron" as const,
        freeNetUsed: zero,
        freeNetLimit: zero,
        netUsed: zero,
        netLimit: zero,
        energyUsed: zero,
        energyLimit: zero,
      };
      const tx: Transaction = { ...mockTransaction, networkInfo: emptyNetworkInfo };
      mockExtractBandwidthInfo.mockReturnValue(insufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(31_895);

      const breakdown = await getFeeResourceBreakdown(mockAccount, tx, mockTokenAccount);
      const fee = await getEstimatedFees(mockAccount, tx, mockTokenAccount, breakdown);

      // bandwidth: getEstimatedBlockSize (mocked 200) − 0 available = 200 missing × transactionFee 1000.
      // energy: 31_895 − 0 available = 31_895 missing × energyFee 210.
      const expectedBandwidthFee = 200 * chainParams.transactionFee;
      const expectedEnergyFee = 31_895 * chainParams.energyFee;
      expect(fee).toEqual(new BigNumber(expectedBandwidthFee + expectedEnergyFee));
    });

    it("energyRequired is the full simulated energy_used, not scaled by the contract sponsorship percent", async () => {
      // Confirmed on mainnet that the caller pays 100% of energy_used regardless of
      // consume_user_resource_percent (deployers do not sponsor in practice), so the breakdown
      // must not scale it down.
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(64_285);

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        mockTransaction,
        mockTokenAccount,
      );

      expect(breakdown.energyRequired).toEqual(new BigNumber(64_285));
    });

    it("simulation failure -> fee falls back to flat STANDARD_FEES_TRC_20, breakdown reports insufficient", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockRejectedValue(new Error("triggerConstantContract failed: REVERT"));

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        mockTransaction,
        mockTokenAccount,
      );
      const fee = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount, breakdown);

      expect(breakdown.energyEstimated).toBe(false);
      expect(breakdown.energyRequired.gt(breakdown.energyAvailable)).toBe(true);
      expect(fee).toEqual(STANDARD_FEES_TRC_20);
    });

    it("does not throw when getChainParameters fails, fee falls back to flat constant", async () => {
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(31_895);
      mockGetChainParameters.mockRejectedValue(new Error("chain params unreachable"));

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        mockTransaction,
        mockTokenAccount,
      );
      const fee = await getEstimatedFees(mockAccount, mockTransaction, mockTokenAccount, breakdown);

      expect(fee).toEqual(STANDARD_FEES_TRC_20);
    });

    it("null networkInfo does not throw, fetches it instead", async () => {
      const unpreparedTransaction: Transaction = { ...mockTransaction, networkInfo: null };
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockEstimateEnergy.mockResolvedValue(1000);
      mockGetTronAccountNetwork.mockResolvedValue(mockTransaction.networkInfo!);

      await expect(
        getFeeResourceBreakdown(mockAccount, unpreparedTransaction, mockTokenAccount),
      ).resolves.not.toThrow();
      expect(mockGetTronAccountNetwork).toHaveBeenCalledWith(mockAccount.freshAddress);
    });

    it("network-info fetch failure does not throw", async () => {
      const unpreparedTransaction: Transaction = { ...mockTransaction, networkInfo: null };
      mockExtractBandwidthInfo.mockReturnValue(sufficientBandwidth);
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const breakdown = await getFeeResourceBreakdown(
        mockAccount,
        unpreparedTransaction,
        mockTokenAccount,
      );

      expect(breakdown.energyEstimated).toBe(false);
    });

    it("network-info fetch failure on a native/non-TRC20 send reports energyRequired 0, not the sentinel", async () => {
      const unpreparedTransaction: Transaction = { ...mockTransaction, networkInfo: null };
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const breakdown = await getFeeResourceBreakdown(mockAccount, unpreparedTransaction, null);

      expect(breakdown.energyRequired).toEqual(new BigNumber(0));
      expect(breakdown.energyEstimated).toBe(true);
    });
  });
});
