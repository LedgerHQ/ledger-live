import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { type TronCoinConfig } from "../config";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import {
  DEFAULT_TRC20_FEES_LIMIT,
  fetchTronAccount,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from "../network";
import { decode58Check } from "../network/format";
import type {
  AccountTronAPI,
  ChainParameters,
  TriggerConstantContractResponse,
} from "../network/types";
import { abiEncodeTrc20Transfer } from "../network/utils";
import type { NetworkInfo } from "../types";
import type { TronMemo, TronTxData } from "../types";
import {
  ACTIVATION_FEES,
  MEMO_FEE_PESSIMISTIC,
  STANDARD_FEES_NATIVE,
  STANDARD_FEES_TRC_20,
} from "./constants";
import {
  computeBandwidthFee,
  computeEnergyFee,
  estimateEnergy,
  estimatedTxSize,
  buildEnergyRentRequest,
  estimateFees,
  estimateSponsoredFeeQuote,
  estimateTronifyFees,
  type TronResourceBreakdown,
} from "./estimateFees";
import { getBalance } from "./getBalance";
import { getEnergyRentQuote } from "./energyRent";

jest.mock("../network", () => ({
  // Real value, not a mock: `estimateFees` computes the TRC-20 `fee_limit` ceiling from it.
  DEFAULT_TRC20_FEES_LIMIT: 50000000,
  fetchTronAccount: jest.fn(),
  getChainParameters: jest.fn(),
  getTronAccountNetwork: jest.fn(),
  triggerConstantContract: jest.fn(),
}));

jest.mock("./getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("./energyRent", () => ({ getEnergyRentQuote: jest.fn() }));

const mockGetBalance = jest.mocked(getBalance);

const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);
const mockFetchTronAccount = jest.mocked(fetchTronAccount);
const mockGetChainParameters = jest.mocked(getChainParameters);
const mockTriggerConstantContract = jest.mocked(triggerConstantContract);
const mockGetEnergyRentQuote = jest.mocked(getEnergyRentQuote);

const mockLogger: Logger = jest.fn();

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
  memoFee: 1_000_000, // 1 TRX, mainnet's value
};

const activeRecipient: AccountTronAPI[] = [{ address: "recipient", trc20: [] }];
const activeRecipientWithToken: AccountTronAPI[] = [
  { address: "recipient", trc20: [{ [TRC20_CONTRACT]: "1000" }] },
];
const inactiveRecipient: AccountTronAPI[] = [];

const SENDER = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";
const RECIPIENT = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";

const sendNative: TransactionIntent<TronMemo, TronTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "native" },
  data: { type: "tron" },
};

const MEMO = "ledger-e2e"; // 10 UTF-8 bytes
const sendNativeWithMemo: TransactionIntent<TronMemo, TronTxData> = {
  ...sendNative,
  memo: { type: "string", kind: "memo", value: MEMO },
};

const sendTrc10: TransactionIntent<TronMemo, TronTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "trc10", assetReference: "1002000" },
  data: { type: "tron" },
};

const sendTrc10WithMemo: TransactionIntent<TronMemo, TronTxData> = {
  ...sendTrc10,
  memo: { type: "string", kind: "memo", value: MEMO },
};

const sendTrc20: TransactionIntent<TronMemo, TronTxData> = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: BigInt(1000),
  asset: { type: "trc20", assetReference: TRC20_CONTRACT },
  data: { type: "tron" },
};

const revertedTransferSimulation: TriggerConstantContractResponse = {
  result: { result: true, message: Buffer.from("REVERT opcode executed").toString("hex") },
  energy_used: 8_624,
  energy_penalty: 6_640,
  constant_result: [""],
  transaction: { ret: [{ ret: "FAILED" }] },
};

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

const voteIntent = (voteCount: number): TransactionIntent<TronMemo, TronTxData> => ({
  intentType: "transaction",
  type: "vote",
  sender: SENDER,
  recipient: "",
  amount: 0n,
  asset: { type: "native" },
  data: {
    type: "tron",
    votes: Array.from({ length: voteCount }, (_, i) => ({
      name: `sr-${i}`,
      address: SENDER,
      voteCount: 1,
    })),
  },
});

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

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(result.value).toBe(0n);
    });

    it("charges size * transactionFee when no bandwidth pool covers the transaction", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(result.value).toBe(BigInt(270 * chainParams.transactionFee));
    });

    it("charges the whole size, not the shortfall, when a pool only partly covers it", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(200) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(result.value).toBe(BigInt(270 * chainParams.transactionFee));
    });

    it("adds activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(result.value).toBe(
        BigInt(chainParams.createAccountFee + chainParams.createNewAccountFeeInSystemContract),
      );
    });
  });

  describe("memo fee (TIP-387)", () => {
    it("adds the chain memo fee on top when a native send carries a memo", async () => {
      // Enough free bandwidth to cover the (slightly larger) memo'd transaction, so the whole fee is
      // the flat memo fee.
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(BigInt(chainParams.memoFee));
    });

    it("grows the bandwidth requirement by the memo's byte length", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(
        BigInt(
          (270 + Buffer.byteLength(MEMO, "utf8")) * chainParams.transactionFee +
            chainParams.memoFee,
        ),
      );
    });

    it("charges no memo fee on a chain that never activated the parameter (getMemoFee = 0)", async () => {
      mockGetChainParameters.mockResolvedValue({ ...chainParams, memoFee: 0 });
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(0n);
    });

    it("prices a memo on a TRC-10 send too (size grows, memo fee added)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendTrc10WithMemo);

      // A TRC-10 transfer carries its memo in `raw_data.data` and pays TIP-387's memo fee the same
      // as a native send.
      expect(result.value).toBe(
        BigInt(
          (285 + Buffer.byteLength(MEMO, "utf8")) * chainParams.transactionFee +
            chainParams.memoFee,
        ),
      );
    });
  });

  describe("trc10 send", () => {
    it("returns 0 when sender has enough bandwidth", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendTrc10);

      expect(result.value).toBe(0n);
    });

    it("charges size * transactionFee when no bandwidth pool covers the transaction", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendTrc10);

      expect(result.value).toBe(BigInt(285 * chainParams.transactionFee));
    });

    it("does NOT add native activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(mockLogger, mockConfig, sendTrc10);

      expect(result.value).toBe(0n);
    });

    it("does not invoke triggerConstantContract (non-contract asset)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      await estimateFees(mockLogger, mockConfig, sendTrc10);

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

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(0n);
    });

    it("charges energy fee when sender has no energy", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(31_895 * chainParams.energyFee));
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

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt((31_895 - 20_000) * chainParams.energyFee));
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

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(0n);
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

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
    });

    it("falls back to the flat fee, as unestimated, when a revert still reports result.result true", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue(revertedTransferSimulation);

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
      expect(breakdownOf(result).energyEstimated).toBe(false);
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

    it("grows the vote size by one protobuf entry per vote", () => {
      expect(estimatedTxSize(voteIntent(1))).toBe(290 + 19);
      expect(estimatedTxSize(voteIntent(3))).toBe(290 + 3 * 19);
    });

    it("uses the base vote size when no votes are attached yet", () => {
      expect(estimatedTxSize(voteIntent(0))).toBe(290);
    });
  });

  describe("estimateEnergy (exported helper)", () => {
    it("returns 0 without calling triggerConstantContract for a non-trc20 asset", async () => {
      const result = await estimateEnergy(mockLogger, mockConfig, sendNative);

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("returns the simulated energy_used for a trc20 asset", async () => {
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 12_345 });

      const result = await estimateEnergy(mockLogger, mockConfig, sendTrc20);

      expect(result).toBe(12_345);
    });

    it("throws when the simulation reports a reverted result", async () => {
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
      });

      await expect(estimateEnergy(mockLogger, mockConfig, sendTrc20)).rejects.toThrow(
        /triggerConstantContract failed/,
      );
    });

    it("throws when the returned transaction is FAILED even though result.result is true", async () => {
      mockTriggerConstantContract.mockResolvedValue(revertedTransferSimulation);

      await expect(estimateEnergy(mockLogger, mockConfig, sendTrc20)).rejects.toThrow(
        /triggerConstantContract failed/,
      );
    });

    it("returns energy_used when the returned transaction carries an empty (successful) ret entry", async () => {
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: true },
        energy_used: 130_285,
        energy_penalty: 100_635,
        transaction: { ret: [{}] },
      });

      const result = await estimateEnergy(mockLogger, mockConfig, sendTrc20);

      expect(result).toBe(130_285);
    });

    it("throws when a successful simulation omits energy_used", async () => {
      mockTriggerConstantContract.mockResolvedValue({ result: { result: true } });

      await expect(estimateEnergy(mockLogger, mockConfig, sendTrc20)).rejects.toThrow(
        /no energy_used/,
      );
    });

    it("skips the simulation for a staking mode that still carries a trc20 asset", async () => {
      // The UI can reach a staking flow from a token sub-account, leaving the asset on the intent.
      const result = await estimateEnergy(mockLogger, mockConfig, { ...sendTrc20, type: "freeze" });

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("skips the simulation for a zero-amount non-max trc20 send", async () => {
      const result = await estimateEnergy(mockLogger, mockConfig, { ...sendTrc20, amount: 0n });

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("simulates a send-max transfer with the token balance, not 0", async () => {
      mockGetBalance.mockResolvedValue([
        { value: 250n, asset: { type: "native" } },
        { value: 4_200n, asset: { type: "trc20", assetReference: TRC20_CONTRACT } },
      ]);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      await estimateEnergy(mockLogger, mockConfig, {
        ...sendTrc20,
        amount: 0n,
        useAllAmount: true,
      });

      const { parameter } = mockTriggerConstantContract.mock.calls[0][2];
      expect(parameter).toBe(
        abiEncodeTrc20Transfer(decode58Check(RECIPIENT), new BigNumber(4_200)),
      );
    });
  });

  describe("computeBandwidthFee (exported helper)", () => {
    it("returns 0 when the size fits within available bandwidth", () => {
      const networkInfo = buildNetworkInfo({ freeNetLimit: new BigNumber(5000) });

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(new BigNumber(0));
    });

    it("charges size * transactionFee when neither pool has any bandwidth", () => {
      const networkInfo = buildNetworkInfo();

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(
        new BigNumber(270 * chainParams.transactionFee),
      );
    });

    it("charges the whole size when a pool covers only part of it (all-or-nothing per pool)", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(150),
        netLimit: new BigNumber(100),
      });

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(
        new BigNumber(270 * chainParams.transactionFee),
      );
    });

    it("returns 0 when a single pool covers the size on its own", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(150),
        netLimit: new BigNumber(300),
      });

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(new BigNumber(0));
    });

    it("does not overcharge when used > limit (available clamped to 0)", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(0),
        freeNetUsed: new BigNumber(500),
      });

      expect(computeBandwidthFee(270, networkInfo, chainParams)).toEqual(
        new BigNumber(270 * chainParams.transactionFee),
      );
    });

    it("clamps each pool independently — a negative free pool does not reduce staked", () => {
      const networkInfo = buildNetworkInfo({
        freeNetLimit: new BigNumber(0),
        freeNetUsed: new BigNumber(500), // free = -500 → 0
        netLimit: new BigNumber(1000),
        netUsed: new BigNumber(0), // staked = 1000
      });

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

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(result.value).toBe(BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).toString()));
    });

    it("returns STANDARD_FEES_TRC_20 when network fails for TRC20 send", async () => {
      mockGetChainParameters.mockRejectedValue(new Error("chain params unreachable"));

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
    });

    it("adds a pessimistic memo fee to the native fallback when the send carries a memo", async () => {
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const result = await estimateFees(mockLogger, mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(
        BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).plus(MEMO_FEE_PESSIMISTIC).toString()),
      );
    });

    it("reports a non-zero requirement against an unknown pool so the tooltip cannot claim coverage", async () => {
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(breakdownOf(result)).toEqual({
        energyRequired: "1",
        energyAvailable: "0",
        bandwidthRequired: "350",
        bandwidthAvailable: "0",
        energyEstimated: false,
        // The energy price is unknown on this path, so the ceiling falls back to the flat default.
        feeLimit: String(DEFAULT_TRC20_FEES_LIMIT),
      });
    });
  });

  describe("resource breakdown (FeeEstimation.parameters)", () => {
    it("reports what the transfer needs and what the account has", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          freeNetUsed: new BigNumber(1000),
          netLimit: new BigNumber(600),
          energyLimit: new BigNumber(100_000),
          energyUsed: new BigNumber(40_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(breakdownOf(result)).toEqual({
        energyRequired: "31895",
        energyAvailable: "60000",
        bandwidthRequired: "350",
        // (5000 - 1000) free + 600 staked
        bandwidthAvailable: "4600",
        energyEstimated: true,
        // 31_895 * energyFee(210) = 6_697_950 gross, under the default, so the default stands.
        feeLimit: String(DEFAULT_TRC20_FEES_LIMIT),
      });
    });

    it("sizes the fee limit against the gross energy cost, not the fee the account will pay", async () => {
      // LIVE-36865: the sender's energy covers the transfer, so the *fee* is 0 — but `fee_limit` is a
      // ceiling on what the TVM may burn, and a 0 ceiling reverts OUT_OF_ENERGY.
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(10_000),
          energyLimit: new BigNumber(1_000_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(result.value).toBe(0n);
      expect(breakdownOf(result).feeLimit).toBe(String(DEFAULT_TRC20_FEES_LIMIT));
    });

    it("ratchets the fee limit above the default for a transfer that costs more than it", async () => {
      // 400_000 * energyFee(210) = 84_000_000 gross, over the 50 TRX default — a cap at the default
      // would revert.
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 400_000 });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      expect(breakdownOf(result).feeLimit).toBe("84000000");
    });

    it("does not raise the fee limit off the energy sentinel when the simulation fails", async () => {
      // A failed simulation sets `energyRequired` to the sender's pool + 1 so consumers read
      // "insufficient" — a 1M-energy account would otherwise get a 210 TRX cap, not the 50 TRX
      // default.
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ energyLimit: new BigNumber(1_000_000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
      });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      const breakdown = breakdownOf(result);
      expect(breakdown.energyEstimated).toBe(false);
      expect(breakdown.energyRequired).toBe("1000001");
      expect(breakdown.feeLimit).toBe(String(DEFAULT_TRC20_FEES_LIMIT));
    });

    it("omits the fee limit for a native send, which has no such field", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);

      const result = await estimateFees(mockLogger, mockConfig, sendNative);

      expect(breakdownOf(result).feeLimit).toBeUndefined();
    });

    it("marks the energy as unestimated and insufficient when the simulation reverts", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({
          freeNetLimit: new BigNumber(5000),
          energyLimit: new BigNumber(100_000),
        }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
      });

      const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

      const breakdown = breakdownOf(result);
      expect(breakdown.energyEstimated).toBe(false);
      // One more than available, so every consumer reads "insufficient" rather than "covered".
      expect(BigInt(breakdown.energyRequired)).toBeGreaterThan(BigInt(breakdown.energyAvailable));
    });
  });

  it("should not call getEnergyRentQuote when invoked directly (no feeOption routing)", async () => {
    // no free resources → full standard burn applies
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
    mockTriggerConstantContract.mockResolvedValue({ energy_used: ENERGY_USED });

    const result = await estimateFees(mockLogger, mockConfig, sendTrc20);

    expect(result.value).toBe(STANDARD_BURN);
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });
});

function breakdownOf(estimation: { parameters?: Record<string, unknown> }): TronResourceBreakdown {
  return estimation.parameters as TronResourceBreakdown;
}

// Expected standard burn for sendTrc20 with no free resources:
//   bandwidth: 350 * transactionFee(1000) = 350_000
//   energy:    31_895 * energyFee(210)    = 6_697_950
//   activation: 0 (TRC-20 send)
//   total: 7_047_950n
const STANDARD_BURN = 7_047_950n;
const ENERGY_USED = 31_895;
const USDT_QUOTE_AMT = "3.2"; // → 3_200_000 USDT base units
const TRONIFY_VALUE = 3_200_000n;

const usdtQuote = {
  energy: BigInt(ENERGY_USED),
  durationSeconds: 600,
  payCoinCode: "USDT",
  payCoinAmt: USDT_QUOTE_AMT,
  fees: { energy: "2.727", trx: "0.773", bandwidth: "0", activateAccount: "0" },
};

describe("estimateTronifyFees", () => {
  let config: TronCoinConfig;

  const setTronifyConfig = (tronify: Record<string, unknown>): TronCoinConfig =>
    ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: { provider: "tronify", tronify },
    }) as unknown as TronCoinConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    // energyRent must be configured for the Tronify path; rental params omitted here so the
    // defaults apply (overridden explicitly in the coin-config test below).
    config = setTronifyConfig({ url: "https://open.tronify.io", sourceFlag: "ledgerLive" });
    // no free bandwidth or energy → full standard burn applies
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: ENERGY_USED });
    mockGetEnergyRentQuote.mockResolvedValue(usdtQuote);
  });

  it("should return the rent in USDT base units, the standard burn in sun, a breakdown and no savings", async () => {
    const result = await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(result.value).toBe(TRONIFY_VALUE);
    expect(result.originalValue).toBe(STANDARD_BURN);
    // Rent and burn are in different units, so no savings figure exists at this layer.
    expect(result.savings).toBeUndefined();
    expect(result.parameters).toMatchObject({
      energyRequired: String(ENERGY_USED),
      energyEstimated: true,
      // 31_895 * energyFee(210) = 6_697_950 gross, under the default, so the default stands.
      feeLimit: String(DEFAULT_TRC20_FEES_LIMIT),
    });
  });

  it("sizes the fee limit from the rental simulation rather than the flat default", async () => {
    // Rented energy that lands short or late still burns against this cap, so a transfer whose
    // gross cost exceeds the default must raise it: 400_000 * energyFee(210) = 84_000_000.
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 400_000 });

    const result = await estimateTronifyFees(mockLogger, mockConfig, sendTrc20);

    expect(breakdownOf(result).feeLimit).toBe("84000000");
  });

  it("should pass the raw estimateEnergy result as the energy pledge without a client-side minimum", async () => {
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 5_000 });

    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ energy: 5_000n }),
    );
  });

  it("should delegate energy to the sender address, not the recipient", async () => {
    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({
        payerAddress: SENDER,
        receiverAddress: SENDER,
      }),
    );
  });

  it("should default to the 10-min fastTrade duration and 0.8 TRX top-up when coin-config omits them", async () => {
    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ durationSeconds: 600, extraTrx: 0.8 }),
    );
  });

  it("should use the rental duration and extra TRX from coin-config when provided", async () => {
    config = setTronifyConfig({
      url: "https://open.tronify.io",
      sourceFlag: "ledgerLive",
      rentalDurationSeconds: 1200,
      rentalExtraTrx: 1.5,
    });

    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ durationSeconds: 1200, extraTrx: 1.5 }),
    );
  });

  it("should fall back to defaults when coin-config rental params are invalid", async () => {
    config = setTronifyConfig({
      url: "https://open.tronify.io",
      sourceFlag: "ledgerLive",
      rentalDurationSeconds: -5,
      rentalExtraTrx: Number.NaN,
    });

    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ durationSeconds: 600, extraTrx: 0.8 }),
    );
  });

  it.each([[0.1], [0.5], [600], [500.5]])(
    "should reject an out-of-range coin-config rentalExtraTrx (%p) and use the default",
    async invalidExtraTrx => {
      config = setTronifyConfig({
        url: "https://open.tronify.io",
        sourceFlag: "ledgerLive",
        rentalExtraTrx: invalidExtraTrx,
      });

      await estimateTronifyFees(mockLogger, config, sendTrc20);

      expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
        mockLogger,
        config,
        expect.objectContaining({ extraTrx: 0.8 }),
      );
    },
  );

  it("should reject a coin-config rentalExtraTrx of 0, which Tronify prices in TRX", async () => {
    config = setTronifyConfig({
      url: "https://open.tronify.io",
      sourceFlag: "ledgerLive",
      rentalExtraTrx: 0,
    });

    await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ extraTrx: 0.8 }),
    );
  });

  it("should round a sub-unit USDT quote up to the next base unit", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinAmt: "3.1245271" });

    const result = await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(result.value).toBe(3_124_528n);
  });

  it("should accept a quote at the 10 USDT cap", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinAmt: "10" });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).resolves.toMatchObject({
      value: 10_000_000n,
    });
  });

  it("should throw on a quote above the 10 USDT cap, so Review never offers it", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinAmt: "10.000001" });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /above the 10000000 cap/,
    );
  });

  it("should apply the cap from coin-config", async () => {
    config = setTronifyConfig({
      url: "https://open.tronify.io",
      sourceFlag: "ledgerLive",
      maxRentAmount: 3,
    });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /above the 3000000 cap/,
    );
  });

  it("should throw when the intent is a native TRX send", async () => {
    await expect(estimateTronifyFees(mockLogger, config, sendNative)).rejects.toThrow(
      /only available for TRC-20/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should throw when the intent is a TRC-10 send", async () => {
    await expect(estimateTronifyFees(mockLogger, config, sendTrc10)).rejects.toThrow(
      /only available for TRC-20/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should throw when the recipient is empty", async () => {
    await expect(
      estimateTronifyFees(mockLogger, config, { ...sendTrc20, recipient: "" }),
    ).rejects.toThrow(/requires a recipient/);
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it.each([
    ["a TRX-denominated quote", { ...usdtQuote, payCoinCode: "TRX" }],
    [
      "the TRX-payment shape (no payCoinCode or payCoinAmt)",
      { ...usdtQuote, payCoinCode: undefined, payCoinAmt: undefined },
    ],
  ])("should throw on %s", async (_label, quote) => {
    mockGetEnergyRentQuote.mockResolvedValue(quote);

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /unsupported payCoinCode/,
    );
  });

  it("should accept a lower-case usdt quote code", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinCode: "usdt" });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).resolves.toMatchObject({
      value: TRONIFY_VALUE,
    });
  });

  it("should throw a clear error (not a TypeError) when payCoinCode is missing", async () => {
    // payCoinCode is unvalidated network data; a missing/non-string value must yield the explicit
    // "unsupported payCoinCode" error rather than a raw TypeError from toUpperCase().
    mockGetEnergyRentQuote.mockResolvedValue({
      ...usdtQuote,
      payCoinCode: undefined as unknown as string,
    });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /unsupported payCoinCode/,
    );
  });

  it("should throw when Tronify returns a non-numeric payCoinAmt", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinAmt: "not-a-number" });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /invalid payCoinAmt/,
    );
  });

  it.each([["0"], ["-1"]])("should throw on a non-positive payCoinAmt (%s)", async payCoinAmt => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...usdtQuote, payCoinAmt });

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /invalid payCoinAmt/,
    );
  });

  it("should propagate TronifyApiError from getEnergyRentQuote without silent fallback", async () => {
    const apiError = Object.assign(new Error("quota exceeded"), {
      name: "TronifyApiError",
      resCode: 429,
    });
    mockGetEnergyRentQuote.mockRejectedValue(apiError);

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toMatchObject({
      name: "TronifyApiError",
      resCode: 429,
    });
  });

  it("should propagate an estimateEnergy failure without silent fallback", async () => {
    mockTriggerConstantContract.mockRejectedValue(new Error("node unreachable"));

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      "node unreachable",
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should not quote a rental sized on a reverted simulation's energy_used", async () => {
    mockTriggerConstantContract.mockResolvedValue(revertedTransferSimulation);

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      /triggerConstantContract failed/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should propagate a getChainParameters failure without silent fallback to pessimistic originalValue", async () => {
    mockGetChainParameters.mockRejectedValue(new Error("chain params unavailable"));

    await expect(estimateTronifyFees(mockLogger, config, sendTrc20)).rejects.toThrow(
      "chain params unavailable",
    );
  });

  it("should propagate the Tronify API response when simulation returns energyNeeded=0", async () => {
    // triggerConstantContract returns 0 — estimateEnergy reports 0, simulation did run.
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 0 });

    const result = await estimateTronifyFees(mockLogger, config, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ energy: 0n }),
    );
    expect(result.value).toBe(TRONIFY_VALUE);
  });

  it("should pass energyNeeded=0 to getEnergyRentQuote when the amount-guard short-circuits the simulation", async () => {
    // amount === 0n && !useAllAmount → estimateEnergy returns 0 without calling triggerConstantContract
    const zeroAmountIntent = { ...sendTrc20, amount: 0n };

    await estimateTronifyFees(mockLogger, config, zeroAmountIntent);

    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      mockLogger,
      config,
      expect.objectContaining({ energy: 0n }),
    );
  });
});

describe("estimateSponsoredFeeQuote", () => {
  let config: TronCoinConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: {
        provider: "tronify",
        tronify: { url: "https://open.tronify.io", sourceFlag: "ledgerLive" },
      },
    } as unknown as TronCoinConfig;
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: ENERGY_USED });
    mockGetEnergyRentQuote.mockResolvedValue(usdtQuote);
  });

  it("returns the USDT fee asset, the rent in its base units and the standard burn in sun", async () => {
    const result = await estimateSponsoredFeeQuote(mockLogger, config, sendTrc20);

    expect(result).toEqual({
      feeAsset: {
        type: "trc20",
        assetReference: TRC20_CONTRACT,
        name: "Tether USD",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
      },
      value: TRONIFY_VALUE,
      originalValue: STANDARD_BURN,
    });
  });

  it("returns a fresh fee asset per call, so mutating one never leaks into the next", async () => {
    const first = await estimateSponsoredFeeQuote(mockLogger, config, sendTrc20);
    const mutated = first.feeAsset.unit as { code: string };
    mutated.code = "MUTATED";

    const second = await estimateSponsoredFeeQuote(mockLogger, config, sendTrc20);

    expect(second.feeAsset.unit?.code).toBe("USDT");
  });

  it("propagates estimateTronifyFees' throw on a non-TRC-20 intent (caller renders no savings)", async () => {
    await expect(estimateSponsoredFeeQuote(mockLogger, config, sendNative)).rejects.toThrow(
      "Tronify fee option is only available for TRC-20 send intents",
    );
  });
});

const tronifyConfigWith = (tronify: Record<string, unknown> = {}): TronCoinConfig =>
  ({
    status: { type: "active" },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent: {
      provider: "tronify",
      tronify: { url: "https://open.tronify.io", sourceFlag: "ledgerLive", ...tronify },
    },
  }) as unknown as TronCoinConfig;

describe("buildEnergyRentRequest", () => {
  let config: TronCoinConfig;

  const REVIEW_FEE = TRONIFY_VALUE;

  const usdtBalance = (value: bigint) =>
    mockGetBalance.mockResolvedValue([
      { value: 50_000_000n, asset: { type: "native" } },
      { value, asset: { type: "trc20", assetReference: TRC20_CONTRACT } },
    ]);

  beforeEach(() => {
    jest.clearAllMocks();
    config = tronifyConfigWith();
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: ENERGY_USED });
    usdtBalance(20_000_000n);
  });

  it("delegates energy to the sender and caps the order at the Review fee plus 5%, without re-quoting", async () => {
    const request = await buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE);

    expect(request).toEqual({
      payerAddress: SENDER,
      receiverAddress: SENDER,
      energy: BigInt(ENERGY_USED),
      durationSeconds: 600,
      extraTrx: 0.8,
      maxPayCoinAmt: "3.36",
      maxPayCoinCode: "USDT",
    });
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it.each([
    [0, "3.2"],
    [0.1, "3.52"],
    [0.99, "6.368"],
  ])("applies a coin-config price margin of %p", async (rentPriceMargin, maxPayCoinAmt) => {
    config = tronifyConfigWith({ rentPriceMargin });

    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
    ).resolves.toMatchObject({ maxPayCoinAmt });
  });

  it("rounds the margin down to a whole base unit", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, 3_210_581n),
    ).resolves.toMatchObject({ maxPayCoinAmt: "3.37111" });
  });

  it.each([[-0.01], [1], [5], [Number.NaN]])(
    "falls back to the 5%% margin on an invalid coin-config one (%p)",
    async rentPriceMargin => {
      config = tronifyConfigWith({ rentPriceMargin });

      await expect(
        buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
      ).resolves.toMatchObject({ maxPayCoinAmt: "3.36" });
      expect(mockLogger).toHaveBeenCalledWith(
        "tron/energyRent",
        expect.stringContaining("rentPriceMargin"),
        { value: rentPriceMargin },
      );
    },
  );

  it("never lets the margin take the ceiling past the 10 USDT cap", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, 9_800_000n),
    ).resolves.toMatchObject({ maxPayCoinAmt: "10" });
  });

  it("accepts a Review fee of exactly the cap", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, 10_000_000n),
    ).resolves.toMatchObject({ maxPayCoinAmt: "10" });
  });

  it("rejects a Review fee above the cap before simulating or ordering", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, 10_000_001n),
    ).rejects.toThrow(/above the 10000000 cap/);
    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
  });

  it("applies the cap from coin-config", async () => {
    config = tronifyConfigWith({ maxRentAmount: 3 });

    await expect(buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE)).rejects.toThrow(
      /above the 3000000 cap/,
    );
  });

  it.each([[0], [-1], ["3"], [Number.POSITIVE_INFINITY]])(
    "falls back to the 10 USDT cap on an invalid coin-config one (%p)",
    async maxRentAmount => {
      config = tronifyConfigWith({ maxRentAmount });

      await expect(
        buildEnergyRentRequest(mockLogger, config, sendTrc20, 9_800_000n),
      ).resolves.toMatchObject({ maxPayCoinAmt: "10" });
      expect(mockLogger).toHaveBeenCalledWith(
        "tron/energyRent",
        expect.stringContaining("maxRentAmount"),
        { value: maxRentAmount },
      );
    },
  );

  it.each([[0n], [-1n]])("rejects a non-positive Review fee (%p)", async fee => {
    await expect(buildEnergyRentRequest(mockLogger, config, sendTrc20, fee)).rejects.toThrow(
      "Energy rent requires the fee approved on Review",
    );
  });

  it("keeps the ceiling within what the USDT balance leaves after the transfer", async () => {
    usdtBalance(3_250_000n);

    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
    ).resolves.toMatchObject({ maxPayCoinAmt: "3.249" });
    expect(mockGetBalance).toHaveBeenCalledWith(mockLogger, config, SENDER);
  });

  it("accepts a USDT balance that exactly covers the transfer plus the Review fee", async () => {
    usdtBalance(3_201_000n);

    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
    ).resolves.toMatchObject({ maxPayCoinAmt: "3.2", maxPayCoinCode: "USDT" });
  });

  it("throws EnergyRentInsufficientBalance when the USDT balance is one base unit short", async () => {
    usdtBalance(3_200_999n);

    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
    ).rejects.toMatchObject({ name: "EnergyRentInsufficientBalance" });
  });

  it("throws EnergyRentInsufficientBalance when the sender holds no USDT", async () => {
    mockGetBalance.mockResolvedValue([{ value: 50_000_000n, asset: { type: "native" } }]);

    await expect(
      buildEnergyRentRequest(mockLogger, config, sendTrc20, REVIEW_FEE),
    ).rejects.toMatchObject({ name: "EnergyRentInsufficientBalance" });
  });

  it("counts only the rent against USDT when the transfer is another TRC-20 token", async () => {
    usdtBalance(3_200_000n);
    const otherToken: TransactionIntent<TronMemo, TronTxData> = {
      ...sendTrc20,
      asset: { type: "trc20", assetReference: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8" },
    };

    await expect(
      buildEnergyRentRequest(mockLogger, config, otherToken, REVIEW_FEE),
    ).resolves.toMatchObject({ maxPayCoinAmt: "3.2" });
  });

  it("throws for a non-TRC-20 intent (caller has gated on listFeeOptions)", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, sendNative, REVIEW_FEE),
    ).rejects.toThrow("Energy rent is only available for TRC-20 send intents");
  });

  it("throws when the recipient is not yet entered", async () => {
    await expect(
      buildEnergyRentRequest(mockLogger, config, { ...sendTrc20, recipient: "" }, REVIEW_FEE),
    ).rejects.toThrow("Energy rent requires a recipient");
  });

  it("rejects a max send before simulating (the amount must be resolved first)", async () => {
    await expect(
      buildEnergyRentRequest(
        mockLogger,
        config,
        { ...sendTrc20, amount: 0n, useAllAmount: true },
        REVIEW_FEE,
      ),
    ).rejects.toThrow("Energy rent requires a resolved amount, not a max send");
    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
  });

  it("rejects a TRC-20 intent without an asset reference", async () => {
    await expect(
      buildEnergyRentRequest(
        mockLogger,
        config,
        { ...sendTrc20, asset: { type: "trc20" } },
        REVIEW_FEE,
      ),
    ).rejects.toThrow("Energy rent is only available for TRC-20 send intents");
  });
});
