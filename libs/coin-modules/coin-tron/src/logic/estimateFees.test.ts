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
import { estimateFees } from "./estimateFees";

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
