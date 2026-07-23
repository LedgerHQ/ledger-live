import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { TronMemo } from "../types";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronRewardNotAvailable,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import { validateIntent } from "./validateIntent";

const mockEstimateFees = jest.fn();
jest.mock("./estimateFees", () => ({
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
}));

const mockValidateAddress = jest.fn();
jest.mock("./validateAddress", () => ({
  validateAddress: (...args: unknown[]) => mockValidateAddress(...args),
}));

const mockFetchTronAccount = jest.fn();
const mockGetTronSuperRepresentatives = jest.fn();
const mockGetUnwithdrawnReward = jest.fn();
const mockGetDelegatedResourceByAddress = jest.fn();
jest.mock("../network", () => ({
  fetchTronAccount: (...args: unknown[]) => mockFetchTronAccount(...args),
  getTronSuperRepresentatives: (...args: unknown[]) => mockGetTronSuperRepresentatives(...args),
  getUnwithdrawnReward: (...args: unknown[]) => mockGetUnwithdrawnReward(...args),
  getDelegatedResourceByAddress: (...args: unknown[]) =>
    mockGetDelegatedResourceByAddress(...args),
}));

const SENDER = "TFCAe8rzCpc1iQE485VE3Ymgj6ULAuhLH7";
const RECIPIENT = "TVqLYbpUXv5Q4j7krFr3duqf2GUZghDfQy";
const TRC20_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function makeIntent(
  overrides: Partial<TransactionIntent<TronMemo>> = {},
): TransactionIntent<TronMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    senderPublicKey: "",
    recipient: RECIPIENT,
    amount: 1_000_000n,
    asset: { type: "native", name: "Tron", unit: { name: "TRX", code: "TRX", magnitude: 6 } },
    useAllAmount: false,
    sequence: 0n,
    memo: { type: "NO_MEMO" },
    ...overrides,
  } as TransactionIntent<TronMemo>;
}

const nativeBalance = (value: bigint): Balance => ({
  value,
  asset: { type: "native" },
});

const trc20Balance = (value: bigint): Balance => ({
  value,
  asset: { type: "trc20", assetReference: TRC20_ADDRESS },
});

const SR_ADDRESS = "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U";

// Minimal AccountTronAPI-shaped object for getTronResources
function makeTronAcc(
  overrides: {
    frozenV2?: { type?: string; amount?: number }[];
    unfrozenV2?: { type?: string; unfreeze_amount: number; unfreeze_expire_time: number }[];
    frozen?: { frozen_balance: number; expire_time: number }[];
    account_resource?: { frozen_balance_for_energy?: { frozen_balance: number; expire_time: number } };
    latest_withdraw_time?: number;
  } = {},
) {
  return [{ address: "", trc20: [], ...overrides }];
}

// Make a staking intent — recipient defaults to empty for modes that don't need it
function makeStakingIntent(
  type: string,
  overrides: Record<string, unknown> = {},
): TransactionIntent<TronMemo> {
  return {
    intentType: "transaction",
    type,
    sender: SENDER,
    senderPublicKey: "",
    recipient: "",
    amount: 0n,
    asset: { type: "native", name: "Tron", unit: { name: "TRX", code: "TRX", magnitude: 6 } },
    useAllAmount: false,
    sequence: 0n,
    memo: { type: "NO_MEMO" },
    ...overrides,
  } as TransactionIntent<TronMemo>;
}

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEstimateFees.mockResolvedValue(270_000n);
    mockValidateAddress.mockResolvedValue(true);
    mockFetchTronAccount.mockResolvedValue([]);
    mockGetTronSuperRepresentatives.mockResolvedValue([]);
    mockGetUnwithdrawnReward.mockResolvedValue(new BigNumber(0));
    mockGetDelegatedResourceByAddress.mockResolvedValue(new BigNumber(0));
  });

  it("accepts a valid native send", async () => {
    const result = await validateIntent(makeIntent(), [nativeBalance(10_000_000n)]);
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1_000_000n);
    expect(result.estimatedFees).toBe(270_000n);
    expect(result.totalSpent).toBe(1_270_000n);
  });

  it("uses customFees when provided", async () => {
    const result = await validateIntent(makeIntent(), [nativeBalance(10_000_000n)], {
      value: 500_000n,
    });
    expect(result.estimatedFees).toBe(500_000n);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  describe("recipient validation", () => {
    it("rejects an empty recipient", async () => {
      const result = await validateIntent(makeIntent({ recipient: "" }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects when sender equals recipient", async () => {
      const result = await validateIntent(makeIntent({ recipient: SENDER }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("rejects a malformed recipient address", async () => {
      mockValidateAddress.mockResolvedValueOnce(false);
      const result = await validateIntent(makeIntent({ recipient: "not-a-real-address" }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });

  describe("native amount validation", () => {
    it("rejects a zero amount when not useAllAmount", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n }), [nativeBalance(10_000_000n)]);
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("rejects when balance is insufficient for amount + fees", async () => {
      const result = await validateIntent(makeIntent({ amount: 10_000_000n }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("subtracts locked balance from available", async () => {
      const balances: Balance[] = [
        { value: 10_000_000n, locked: 9_000_000n, asset: { type: "native" } },
      ];
      const result = await validateIntent(makeIntent({ amount: 1_500_000n }), balances);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("computes amount = available - fees when useAllAmount", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n, useAllAmount: true }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors).toEqual({});
      expect(result.amount).toBe(9_730_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });

    it("surfaces NotEnoughBalance and NotEnoughGas when useAllAmount but fees exceed balance", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n, useAllAmount: true }), [
        nativeBalance(100_000n),
      ]);
      expect(result.amount).toBe(0n);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
    });
  });

  describe("token amount validation", () => {
    const tokenIntent = makeIntent({
      asset: {
        type: "trc20",
        assetReference: TRC20_ADDRESS,
        name: "USDT",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
        assetOwner: SENDER,
      },
    });

    it("accepts a valid token send", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors).toEqual({});
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("rejects when token balance is insufficient", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(500n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("surfaces fee shortfall on gasLimit (NotEnoughGas), not on amount, for token sends", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(100n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
      expect(result.errors.amount).toBeUndefined();
    });

    it("sets amount = full token balance when useAllAmount", async () => {
      const result = await validateIntent({ ...tokenIntent, amount: 0n, useAllAmount: true }, [
        nativeBalance(10_000_000n),
        trc20Balance(7_500_000n),
      ]);
      expect(result.amount).toBe(7_500_000n);
    });
  });

  describe("freeze", () => {
    it("accepts a valid freeze", async () => {
      const result = await validateIntent(
        makeStakingIntent("freeze", { amount: 5_000_000n }),
        [nativeBalance(20_000_000n)],
      );
      expect(result.errors).toEqual({});
      expect(result.amount).toBe(5_000_000n);
      expect(result.totalSpent).toBe(5_270_000n);
    });

    it("rejects amount below 1 TRX", async () => {
      const result = await validateIntent(
        makeStakingIntent("freeze", { amount: 500_000n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.amount).toBeInstanceOf(TronInvalidFreezeAmount);
    });

    it("rejects a zero freeze amount", async () => {
      const result = await validateIntent(
        makeStakingIntent("freeze", { amount: 0n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("rejects when balance is insufficient for freeze + fees", async () => {
      const result = await validateIntent(
        makeStakingIntent("freeze", { amount: 10_000_000n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("unfreeze", () => {
    const frozenAcc = makeTronAcc({
      frozenV2: [{ amount: 5_000_000 }, { type: "ENERGY", amount: 3_000_000 }],
    });

    it("accepts a valid BANDWIDTH unfreeze within frozen amount", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      const result = await validateIntent(
        makeStakingIntent("unfreeze", { resource: "BANDWIDTH", amount: 3_000_000n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });

    it("rejects BANDWIDTH unfreeze when no bandwidth is frozen", async () => {
      mockFetchTronAccount.mockResolvedValue(makeTronAcc({ frozenV2: [{ type: "ENERGY", amount: 3_000_000 }] }));
      const result = await validateIntent(
        makeStakingIntent("unfreeze", { resource: "BANDWIDTH", amount: 1_000_000n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForBandwidth);
    });

    it("rejects ENERGY unfreeze when amount exceeds frozen energy", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      const result = await validateIntent(
        makeStakingIntent("unfreeze", { resource: "ENERGY", amount: 5_000_000n }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForEnergy);
    });

    it("surfaces NotEnoughGas when fees exceed balance", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      const result = await validateIntent(
        makeStakingIntent("unfreeze", { resource: "BANDWIDTH", amount: 1_000_000n }),
        [nativeBalance(100n)],
      );
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
    });
  });

  describe("vote", () => {
    const frozenAcc = makeTronAcc({
      // 8 TRX frozen → 8 tron power
      frozenV2: [{ amount: 5_000_000 }, { type: "ENERGY", amount: 3_000_000 }],
    });
    const sr = [{ address: SR_ADDRESS, voteCount: 100, isJobs: false, url: "" }];

    it("rejects when votes array is empty", async () => {
      const result = await validateIntent(
        makeStakingIntent("vote", { votes: [] }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.vote).toBeInstanceOf(TronVoteRequired);
    });

    it("rejects when vote address is not a super representative", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      mockGetTronSuperRepresentatives.mockResolvedValue(sr);
      const result = await validateIntent(
        makeStakingIntent("vote", { votes: [{ address: RECIPIENT, voteCount: 1 }] }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.vote).toBeInstanceOf(InvalidAddress);
    });

    it("rejects when any vote count is zero", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      mockGetTronSuperRepresentatives.mockResolvedValue(sr);
      const result = await validateIntent(
        makeStakingIntent("vote", { votes: [{ address: SR_ADDRESS, voteCount: 0 }] }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.vote).toBeInstanceOf(TronInvalidVoteCount);
    });

    it("rejects when total vote count exceeds tron power", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      mockGetTronSuperRepresentatives.mockResolvedValue(sr);
      const result = await validateIntent(
        makeStakingIntent("vote", { votes: [{ address: SR_ADDRESS, voteCount: 9 }] }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.vote).toBeInstanceOf(TronNotEnoughTronPower);
    });

    it("accepts valid votes within tron power", async () => {
      mockFetchTronAccount.mockResolvedValue(frozenAcc);
      mockGetTronSuperRepresentatives.mockResolvedValue(sr);
      const result = await validateIntent(
        makeStakingIntent("vote", { votes: [{ address: SR_ADDRESS, voteCount: 5 }] }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });
  });

  describe("claimReward", () => {
    it("rejects when unwithdrawn reward is zero", async () => {
      mockFetchTronAccount.mockResolvedValue(makeTronAcc());
      mockGetUnwithdrawnReward.mockResolvedValue(new BigNumber(0));
      const result = await validateIntent(
        makeStakingIntent("claimReward"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.reward).toBeInstanceOf(TronNoReward);
    });

    it("rejects when last withdrawal was less than 24 hours ago", async () => {
      const recentWithdraw = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({ latest_withdraw_time: recentWithdraw }),
      );
      mockGetUnwithdrawnReward.mockResolvedValue(new BigNumber(1_000_000));
      const result = await validateIntent(
        makeStakingIntent("claimReward"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.reward).toBeInstanceOf(TronRewardNotAvailable);
    });

    it("accepts when reward is available and last withdrawal was over 24 hours ago", async () => {
      const oldWithdraw = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({ latest_withdraw_time: oldWithdraw }),
      );
      mockGetUnwithdrawnReward.mockResolvedValue(new BigNumber(1_000_000));
      const result = await validateIntent(
        makeStakingIntent("claimReward"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });
  });

  describe("withdrawExpireUnfreeze", () => {
    it("rejects when there are no unfrozen resources", async () => {
      mockFetchTronAccount.mockResolvedValue(makeTronAcc({ unfrozenV2: [] }));
      const result = await validateIntent(
        makeStakingIntent("withdrawExpireUnfreeze"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronNoUnfrozenResource);
    });

    it("rejects when no unfrozen resource has expired yet", async () => {
      const futureExpiry = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days from now
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({
          unfrozenV2: [{ unfreeze_amount: 1_000_000, unfreeze_expire_time: futureExpiry }],
        }),
      );
      const result = await validateIntent(
        makeStakingIntent("withdrawExpireUnfreeze"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronUnfreezeNotExpired);
    });

    it("accepts when at least one unfrozen resource has expired", async () => {
      const pastExpiry = Date.now() - 1000;
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({
          unfrozenV2: [{ unfreeze_amount: 1_000_000, unfreeze_expire_time: pastExpiry }],
        }),
      );
      const result = await validateIntent(
        makeStakingIntent("withdrawExpireUnfreeze"),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });
  });

  describe("legacyUnfreeze", () => {
    it("rejects when no legacy bandwidth is frozen", async () => {
      mockFetchTronAccount.mockResolvedValue(makeTronAcc({ frozen: [] }));
      const result = await validateIntent(
        makeStakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForBandwidth);
    });

    it("rejects when legacy freeze has not expired yet", async () => {
      const futureExpiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({ frozen: [{ frozen_balance: 1_000_000, expire_time: futureExpiry }] }),
      );
      const result = await validateIntent(
        makeStakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronLegacyUnfreezeNotExpired);
    });

    it("accepts when legacy freeze has expired", async () => {
      const pastExpiry = Date.now() - 1000;
      mockFetchTronAccount.mockResolvedValue(
        makeTronAcc({ frozen: [{ frozen_balance: 1_000_000, expire_time: pastExpiry }] }),
      );
      const result = await validateIntent(
        makeStakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });
  });

  describe("unDelegateResource", () => {
    it("rejects when delegated amount is less than requested", async () => {
      mockGetDelegatedResourceByAddress.mockResolvedValue(new BigNumber(500_000));
      const result = await validateIntent(
        makeStakingIntent("unDelegateResource", {
          recipient: RECIPIENT,
          resource: "BANDWIDTH",
          amount: 1_000_000n,
        }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.resource).toBeInstanceOf(TronInvalidUnDelegateResourceAmount);
    });

    it("accepts when delegated amount covers the requested amount", async () => {
      mockGetDelegatedResourceByAddress.mockResolvedValue(new BigNumber(5_000_000));
      const result = await validateIntent(
        makeStakingIntent("unDelegateResource", {
          recipient: RECIPIENT,
          resource: "BANDWIDTH",
          amount: 1_000_000n,
        }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
    });

    it("validates recipient address", async () => {
      mockValidateAddress.mockResolvedValueOnce(false);
      mockGetDelegatedResourceByAddress.mockResolvedValue(new BigNumber(5_000_000));
      const result = await validateIntent(
        makeStakingIntent("unDelegateResource", {
          recipient: "bad-address",
          resource: "BANDWIDTH",
          amount: 1_000_000n,
        }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });
});
