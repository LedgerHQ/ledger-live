import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import {
  fetchTronAccount,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from "../network";
import type { AccountTronAPI, ChainParameters } from "../network/types";
import type { NetworkInfo } from "../types";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "./constants";
import {
  computeBandwidthFee,
  computeEnergyFee,
  estimateEnergy,
  estimatedTxSize,
  estimateFees,
} from "./estimateFees";

jest.mock("../network", () => ({
  fetchTronAccount: jest.fn(),
  getChainParameters: jest.fn(),
  getTronAccountNetwork: jest.fn(),
  triggerConstantContract: jest.fn(),
}));

const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);
const mockFetchTronAccount = jest.mocked(fetchTronAccount);
const mockGetChainParameters = jest.mocked(getChainParameters);
const mockTriggerConstantContract = jest.mocked(triggerConstantContract);

const TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const buildNetworkInfo = (overrides: Partial<NetworkInfo> = {}): NetworkInfo => ({
  family: "tron",
  freeNetUsed: new BigNumber(0),
  freeNetLimit: new BigNumber(0),
  netUsed: new BigNumber(0),
  netLimit: new BigNumber(0),
  energyUsed: new BigNumber(0),
  energyLimit: new BigNumber(0),
  ...overrides,
});

const chainParams: ChainParameters = {
  energyFee: 210,
  transactionFee: 1000,
  createAccountFee: 100_000,
  createNewAccountFeeInSystemContract: 1_000_000,
};

const activeRecipient: AccountTronAPI[] = [{ address: "recipient", trc20: [] }];
const activeRecipientWithToken: AccountTronAPI[] = [
  { address: "recipient", trc20: [{ [TRC20_CONTRACT]: "1000" }] },
];
const inactiveRecipient: AccountTronAPI[] = [];

const SENDER = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";
const RECIPIENT = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";

const sendNative: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "native" },
};

const sendTrc10: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "trc10", assetReference: "1002000" },
};

const sendTrc20: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "trc20", assetReference: TRC20_CONTRACT },
};

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 0 });
  });

  describe("native send", () => {
    it("returns 0 when sender has enough free bandwidth", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(sendNative);

      expect(result).toBe(0n);
    });

    it("charges (size - available) * transactionFee when bandwidth is insufficient", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(sendNative);

      expect(result).toBe(BigInt(270 * chainParams.transactionFee));
    });

    it("adds activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(sendNative);

      expect(result).toBe(
        BigInt(chainParams.createAccountFee + chainParams.createNewAccountFeeInSystemContract),
      );
    });
  });

  describe("trc10 send", () => {
    it("returns 0 when sender has enough bandwidth", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(sendTrc10);

      expect(result).toBe(0n);
    });

    it("charges (size - available) * transactionFee when bandwidth is insufficient", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(sendTrc10);

      expect(result).toBe(BigInt(285 * chainParams.transactionFee));
    });

    it("does NOT add native activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(sendTrc10);

      expect(result).toBe(0n);
    });

    it("does not invoke triggerConstantContract (non-contract asset)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      await estimateFees(sendTrc10);

      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });
  });

  describe("trc20 send", () => {
    it("returns 0 when sender has enough bandwidth and energy", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          energyLimit: new BigNumber(100_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(0n);
    });

    it("charges energy fee when sender has no energy", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(BigInt(31_895 * chainParams.energyFee));
    });

    it("partially covers energy when sender has some", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          energyLimit: new BigNumber(20_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(BigInt((31_895 - 20_000) * chainParams.energyFee));
    });

    it("does NOT add native activation fee when recipient is inactive (contract storage handled via energy)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          energyLimit: new BigNumber(100_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 64_285 });

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(0n);
    });

    it("falls back when the simulation reverts", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          energyLimit: new BigNumber(100_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
        energy_used: 0,
      });

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
    });
  });

  describe("estimatedTxSize (exported helper)", () => {
    it("returns the TransferAssetContract size for a trc10 send", () => {
      expect(estimatedTxSize(sendTrc10)).toBe(285);
    });

    it("returns the TriggerSmartContract size for a trc20 send", () => {
      expect(estimatedTxSize(sendTrc20)).toBe(350);
    });

    it("returns the TransferContract size for a native send", () => {
      expect(estimatedTxSize(sendNative)).toBe(270);
    });

    it("throws for an unsupported intent type", () => {
      expect(() => estimatedTxSize({ ...sendNative, type: "unsupported" as never })).toThrow();
    });
  });

  describe("estimateEnergy (exported helper)", () => {
    it("returns 0 without calling triggerConstantContract for a non-trc20 asset", async () => {
      const result = await estimateEnergy(sendNative);

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("returns the simulated energy_used for a trc20 asset", async () => {
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 12_345 });

      const result = await estimateEnergy(sendTrc20);

      expect(result).toBe(12_345);
    });

    it("throws when the simulation reports a reverted result", async () => {
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
      });

      await expect(estimateEnergy(sendTrc20)).rejects.toThrow(/triggerConstantContract failed/);
    });

    it("throws when a successful simulation omits energy_used", async () => {
      mockTriggerConstantContract.mockResolvedValue({ result: { result: true } });

      await expect(estimateEnergy(sendTrc20)).rejects.toThrow(/no energy_used/);
    });
  });

  describe("computeBandwidthFee (exported helper)", () => {
    it("returns 0 when the size fits within available bandwidth", () => {
      const networkInfo = buildNetworkInfo({ freeNetLimit: new BigNumber(5000) });

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(new BigNumber(0));
    });

    it("charges (size - available) * transactionFee when bandwidth is insufficient", () => {
      const networkInfo = buildNetworkInfo();

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(
        new BigNumber(270 * chainParams.transactionFee),
      );
    });

    it("does not overcharge when used > limit (available clamped to 0)", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(0),
        freeNetUsed: new BigNumber(500),
      });

      // available = -500 → clamped 0 → missing = size (270), not size + 500.
      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(
        new BigNumber(270 * chainParams.transactionFee),
      );
    });

    it("clamps each bucket independently — a negative free bucket does not reduce staked", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(0),
        freeNetUsed: new BigNumber(500), // free = -500 → 0
        netLimit: new BigNumber(1000),
        netUsed: new BigNumber(0), // staked = 1000
      });

      // 800 fits within the 1000 staked bucket → 0 fee. (Clamping the *sum* would report 500
      // available and wrongly charge for a 300 shortfall.)
      expect(computeBandwidthFee(800, networkInfo, chainParams)).toEqual(new BigNumber(0));
    });
  });

  describe("computeEnergyFee (exported helper)", () => {
    it("returns 0 when energy needed fits within available energy", () => {
      const networkInfo = buildNetworkInfo({ energyLimit: new BigNumber(100_000) });

      expect(computeEnergyFee(31_895, networkInfo, chainParams)).toEqual(new BigNumber(0));
    });

    it("charges (needed - available) * energyFee when energy is insufficient", () => {
      const networkInfo = buildNetworkInfo({ energyLimit: new BigNumber(20_000) });

      expect(computeEnergyFee(31_895, networkInfo, chainParams)).toEqual(
        new BigNumber((31_895 - 20_000) * chainParams.energyFee),
      );
    });

    it("does not overcharge when energyUsed > energyLimit (available clamped to 0)", () => {
      const networkInfo = buildNetworkInfo({
        energyLimit: new BigNumber(0),
        energyUsed: new BigNumber(5000),
      });

      // available = -5000 → clamped 0 → missing = energyNeeded (31_895), not 36_895.
      expect(computeEnergyFee(31_895, networkInfo, chainParams)).toEqual(
        new BigNumber(31_895 * chainParams.energyFee),
      );
    });
  });

  describe("fallback", () => {
    it("returns activation + bandwidth worst case when network fails for native send", async () => {
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const result = await estimateFees(sendNative);

      expect(result).toBe(BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).toString()));
    });

    it("returns STANDARD_FEES_TRC_20 when network fails for TRC20 send", async () => {
      mockGetChainParameters.mockRejectedValue(new Error("chain params unreachable"));

      const result = await estimateFees(sendTrc20);

      expect(result).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
    });
  });
});
