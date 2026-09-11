import coinConfig, { type TronCoinConfig } from "../config";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import {
  fetchTronAccount,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from "../network";
import { decode58Check } from "../network/format";
import type { AccountTronAPI, ChainParameters } from "../network/types";
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
  estimateFees,
  estimateTronifyFees,
  type TronResourceBreakdown,
} from "./estimateFees";
import { getBalance } from "./getBalance";
import { getEnergyRentQuote } from "./energyRent";

jest.mock("../network", () => ({
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

      const result = await estimateFees(mockConfig, sendNative);

      expect(result.value).toBe(0n);
    });

    it("charges size * transactionFee when no bandwidth pool covers the transaction", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockConfig, sendNative);

      expect(result.value).toBe(BigInt(270 * chainParams.transactionFee));
    });

    it("charges the whole size, not the shortfall, when a pool only partly covers it", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(200) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockConfig, sendNative);

      expect(result.value).toBe(BigInt(270 * chainParams.transactionFee));
    });

    it("adds activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(mockConfig, sendNative);

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

      const result = await estimateFees(mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(BigInt(chainParams.memoFee));
    });

    it("grows the bandwidth requirement by the memo's byte length", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockConfig, sendNativeWithMemo);

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

      const result = await estimateFees(mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(0n);
    });

    it("prices a memo on a TRC-10 send too (size grows, memo fee added)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockConfig, sendTrc10WithMemo);

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

      const result = await estimateFees(mockConfig, sendTrc10);

      expect(result.value).toBe(0n);
    });

    it("charges size * transactionFee when no bandwidth pool covers the transaction", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      const result = await estimateFees(mockConfig, sendTrc10);

      expect(result.value).toBe(BigInt(285 * chainParams.transactionFee));
    });

    it("does NOT add native activation fee when recipient is inactive", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(inactiveRecipient);

      const result = await estimateFees(mockConfig, sendTrc10);

      expect(result.value).toBe(0n);
    });

    it("does not invoke triggerConstantContract (non-contract asset)", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipient);

      await estimateFees(mockConfig, sendTrc10);

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

      const result = await estimateFees(mockConfig, sendTrc20);

      expect(result.value).toBe(0n);
    });

    it("charges energy fee when sender has no energy", async () => {
      mockGetTronAccountNetwork.mockResolvedValue(
        buildNetworkInfo({ freeNetLimit: new BigNumber(5000) }),
      );
      mockFetchTronAccount.mockResolvedValue(activeRecipientWithToken);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      const result = await estimateFees(mockConfig, sendTrc20);

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

      const result = await estimateFees(mockConfig, sendTrc20);

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

      const result = await estimateFees(mockConfig, sendTrc20);

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

      const result = await estimateFees(mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
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
      const result = await estimateEnergy(mockConfig, sendNative);

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("returns the simulated energy_used for a trc20 asset", async () => {
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 12_345 });

      const result = await estimateEnergy(mockConfig, sendTrc20);

      expect(result).toBe(12_345);
    });

    it("throws when the simulation reports a reverted result", async () => {
      mockTriggerConstantContract.mockResolvedValue({
        result: { result: false, code: "REVERT", message: "insufficient balance" },
      });

      await expect(estimateEnergy(mockConfig, sendTrc20)).rejects.toThrow(
        /triggerConstantContract failed/,
      );
    });

    it("throws when a successful simulation omits energy_used", async () => {
      mockTriggerConstantContract.mockResolvedValue({ result: { result: true } });

      await expect(estimateEnergy(mockConfig, sendTrc20)).rejects.toThrow(/no energy_used/);
    });

    it("skips the simulation for a staking mode that still carries a trc20 asset", async () => {
      // The UI can reach a staking flow from a token sub-account, leaving the asset on the intent.
      const result = await estimateEnergy(mockConfig, { ...sendTrc20, type: "freeze" });

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("skips the simulation for a zero-amount non-max trc20 send", async () => {
      const result = await estimateEnergy(mockConfig, { ...sendTrc20, amount: 0n });

      expect(result).toBe(0);
      expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    });

    it("simulates a send-max transfer with the token balance, not 0", async () => {
      mockGetBalance.mockResolvedValue([
        { value: 250n, asset: { type: "native" } },
        { value: 4_200n, asset: { type: "trc20", assetReference: TRC20_CONTRACT } },
      ]);
      mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

      await estimateEnergy(mockConfig, { ...sendTrc20, amount: 0n, useAllAmount: true });

      const { parameter } = mockTriggerConstantContract.mock.calls[0][1];
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

      const result = await estimateFees(mockConfig, sendNative);

      expect(result.value).toBe(BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).toString()));
    });

    it("returns STANDARD_FEES_TRC_20 when network fails for TRC20 send", async () => {
      mockGetChainParameters.mockRejectedValue(new Error("chain params unreachable"));

      const result = await estimateFees(mockConfig, sendTrc20);

      expect(result.value).toBe(BigInt(STANDARD_FEES_TRC_20.toString()));
    });

    it("adds a pessimistic memo fee to the native fallback when the send carries a memo", async () => {
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const result = await estimateFees(mockConfig, sendNativeWithMemo);

      expect(result.value).toBe(
        BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).plus(MEMO_FEE_PESSIMISTIC).toString()),
      );
    });

    it("reports a non-zero requirement against an unknown pool so the tooltip cannot claim coverage", async () => {
      mockGetTronAccountNetwork.mockRejectedValue(new Error("network down"));

      const result = await estimateFees(mockConfig, sendTrc20);

      expect(breakdownOf(result)).toEqual({
        energyRequired: "1",
        energyAvailable: "0",
        bandwidthRequired: "350",
        bandwidthAvailable: "0",
        energyEstimated: false,
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

      const result = await estimateFees(mockConfig, sendTrc20);

      expect(breakdownOf(result)).toEqual({
        energyRequired: "31895",
        energyAvailable: "60000",
        bandwidthRequired: "350",
        // (5000 - 1000) free + 600 staked
        bandwidthAvailable: "4600",
        energyEstimated: true,
      });
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

      const result = await estimateFees(mockConfig, sendTrc20);

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

    const result = await estimateFees(mockConfig, sendTrc20);

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
const TRX_QUOTE_AMT = "3.5"; // → 3_500_000 SUN
const TRONIFY_VALUE = 3_500_000n;

const trxQuote = {
  energy: BigInt(ENERGY_USED),
  durationSeconds: 600,
  payCoinCode: "TRX",
  payCoinAmt: TRX_QUOTE_AMT,
  fees: { energy: "2.727", trx: "0.773", bandwidth: "0", activateAccount: "0" },
};

describe("estimateTronifyFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // energyRent must be configured for the Tronify path; rental params omitted here so the
    // defaults apply (overridden explicitly in the coin-config test below).
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: {
        provider: "tronify",
        tronify: { url: "https://open.tronify.io", sourceFlag: "ledgerLive" },
      },
    }));
    // no free bandwidth or energy → full standard burn applies
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: ENERGY_USED });
    mockGetEnergyRentQuote.mockResolvedValue(trxQuote);
  });

  it("should return value, originalValue, savings and a resource breakdown when the quote is TRX-denominated", async () => {
    const result = await estimateTronifyFees(mockConfig, sendTrc20);

    expect(result.value).toBe(TRONIFY_VALUE);
    expect(result.originalValue).toBe(STANDARD_BURN);
    expect(result.savings).toBe(STANDARD_BURN - TRONIFY_VALUE);
    expect(result.parameters).toMatchObject({
      energyRequired: String(ENERGY_USED),
      energyEstimated: true,
    });
  });

  it("should pass the raw estimateEnergy result as the energy pledge without a client-side minimum", async () => {
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 5_000 });

    await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      expect.objectContaining({ energy: 5_000n }),
    );
  });

  it("should delegate energy to the sender address, not the recipient", async () => {
    await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        payerAddress: SENDER,
        receiverAddress: SENDER,
      }),
    );
  });

  it("should default to the 10-min fastTrade duration and 0.8 TRX top-up when coin-config omits them", async () => {
    await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 600, extraTrx: 0.8 }),
    );
  });

  it("should use the rental duration and extra TRX from coin-config when provided", async () => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: {
        provider: "tronify",
        tronify: {
          url: "https://open.tronify.io",
          sourceFlag: "ledgerLive",
          rentalDurationSeconds: 1200,
          rentalExtraTrx: 1.5,
        },
      },
    }));

    await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 1200, extraTrx: 1.5 }),
    );
  });

  it("should fall back to defaults when coin-config rental params are invalid", async () => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: {
        provider: "tronify",
        tronify: {
          url: "https://open.tronify.io",
          sourceFlag: "ledgerLive",
          rentalDurationSeconds: -5,
          rentalExtraTrx: Number.NaN,
        },
      },
    }));

    await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 600, extraTrx: 0.8 }),
    );
  });

  it("should compute savings as originalValue - value", async () => {
    const result = await estimateTronifyFees(mockConfig, sendTrc20);

    expect(result.originalValue).toBe(STANDARD_BURN);
    const originalValue = result.originalValue as bigint;
    expect(result.savings).toBe(originalValue - result.value);
  });

  it("should throw when the intent is a native TRX send", async () => {
    await expect(estimateTronifyFees(mockConfig, sendNative)).rejects.toThrow(
      /only available for TRC-20/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should throw when the intent is a TRC-10 send", async () => {
    await expect(estimateTronifyFees(mockConfig, sendTrc10)).rejects.toThrow(
      /only available for TRC-20/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should throw when the recipient is empty", async () => {
    await expect(estimateTronifyFees(mockConfig, { ...sendTrc20, recipient: "" })).rejects.toThrow(
      /requires a recipient/,
    );
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should throw when Tronify returns a USDT-denominated quote", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...trxQuote, payCoinCode: "USDT" });

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toThrow(
      /unsupported payCoinCode/,
    );
  });

  it("should throw a clear error (not a TypeError) when payCoinCode is missing", async () => {
    // payCoinCode is unvalidated network data; a missing/non-string value must yield the explicit
    // "unsupported payCoinCode" error rather than a raw TypeError from toUpperCase().
    mockGetEnergyRentQuote.mockResolvedValue({
      ...trxQuote,
      payCoinCode: undefined as unknown as string,
    });

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toThrow(
      /unsupported payCoinCode/,
    );
  });

  it("should throw when Tronify returns a non-numeric payCoinAmt", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({ ...trxQuote, payCoinAmt: "not-a-number" });

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toThrow(/invalid payCoinAmt/);
  });

  it("should propagate TronifyApiError from getEnergyRentQuote without silent fallback", async () => {
    const apiError = Object.assign(new Error("quota exceeded"), {
      name: "TronifyApiError",
      resCode: 429,
    });
    mockGetEnergyRentQuote.mockRejectedValue(apiError);

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toMatchObject({
      name: "TronifyApiError",
      resCode: 429,
    });
  });

  it("should propagate an estimateEnergy failure without silent fallback", async () => {
    mockTriggerConstantContract.mockRejectedValue(new Error("node unreachable"));

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toThrow("node unreachable");
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("should propagate a getChainParameters failure without silent fallback to pessimistic originalValue", async () => {
    mockGetChainParameters.mockRejectedValue(new Error("chain params unavailable"));

    await expect(estimateTronifyFees(mockConfig, sendTrc20)).rejects.toThrow(
      "chain params unavailable",
    );
  });

  it("should clamp savings to 0n when the Tronify quote exceeds the standard burn", async () => {
    // 10 TRX (10_000_000 SUN) > STANDARD_BURN (7_047_950n)
    mockGetEnergyRentQuote.mockResolvedValue({ ...trxQuote, payCoinAmt: "10" });

    const result = await estimateTronifyFees(mockConfig, sendTrc20);

    expect(result.savings).toBe(0n);
    expect(result.value).toBe(10_000_000n);
    expect(result.originalValue).toBe(STANDARD_BURN);
  });

  it("should propagate the Tronify API response when simulation returns energyNeeded=0", async () => {
    // triggerConstantContract returns 0 — estimateEnergy reports 0, simulation did run.
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 0 });

    const result = await estimateTronifyFees(mockConfig, sendTrc20);

    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(expect.objectContaining({ energy: 0n }));
    expect(result.value).toBe(TRONIFY_VALUE);
  });

  it("should pass energyNeeded=0 to getEnergyRentQuote when the amount-guard short-circuits the simulation", async () => {
    // amount === 0n && !useAllAmount → estimateEnergy returns 0 without calling triggerConstantContract
    const zeroAmountIntent = { ...sendTrc20, amount: 0n };

    await estimateTronifyFees(mockConfig, zeroAmountIntent);

    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith(expect.objectContaining({ energy: 0n }));
  });
});
