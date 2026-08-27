import type { TronCoinConfig } from "../config";
import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import type { TronMemo, TronResources, TronTxData } from "../types";
import {
  NotEnoughGas,
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughEnergy,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronRewardNotAvailable,
  TronUnexpectedFees,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import { defaultTronResources } from "./tronResources";
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
const mockGetDelegatedResource = jest.fn();
const mockGetTronSuperRepresentatives = jest.fn();
jest.mock("../network", () => ({
  fetchTronAccount: (...args: unknown[]) => mockFetchTronAccount(...args),
  getDelegatedResource: (...args: unknown[]) => mockGetDelegatedResource(...args),
  getTronSuperRepresentatives: (...args: unknown[]) => mockGetTronSuperRepresentatives(...args),
}));

const mockFetchTronResources = jest.fn();
jest.mock("./tronResources", () => ({
  // `defaultTronResources` stays real — the tests build their fixtures from it.
  ...jest.requireActual("./tronResources"),
  fetchTronResources: (...args: unknown[]) => mockFetchTronResources(...args),
}));

const SENDER = "TFCAe8rzCpc1iQE485VE3Ymgj6ULAuhLH7";
const RECIPIENT = "TVqLYbpUXv5Q4j7krFr3duqf2GUZghDfQy";
const TRC20_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const SR_ADDRESS = "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH";

function makeIntent(
  overrides: Partial<TransactionIntent<TronMemo, TronTxData>> = {},
): TransactionIntent<TronMemo, TronTxData> {
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
    memo: { type: "none" },
    data: { type: "tron" },
    ...overrides,
  } as TransactionIntent<TronMemo, TronTxData>;
}

const nativeBalance = (value: bigint): Balance => ({
  value,
  asset: { type: "native" },
});

const trc20Balance = (value: bigint): Balance => ({
  value,
  asset: { type: "trc20", assetReference: TRC20_ADDRESS },
});

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

function makeResources(overrides: Partial<TronResources> = {}): TronResources {
  return {
    ...defaultTronResources,
    ...overrides,
  };
}

/** A staking intent: no recipient, mode and payload supplied by the caller. */
function makeStakingIntent(
  type: string,
  data: Partial<TronTxData> = {},
  overrides: Partial<TransactionIntent<TronMemo, TronTxData>> = {},
): TransactionIntent<TronMemo, TronTxData> {
  return makeIntent({
    type,
    recipient: "",
    amount: 0n,
    data: { type: "tron", ...data },
    ...overrides,
  });
}

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEstimateFees.mockResolvedValue({ value: 270_000n });
    mockValidateAddress.mockResolvedValue(true);
    // An activated recipient: the default for a plain send.
    mockFetchTronAccount.mockResolvedValue([{ address: "recipient" }]);
    mockFetchTronResources.mockResolvedValue(makeResources());
    mockGetTronSuperRepresentatives.mockResolvedValue([{ address: SR_ADDRESS }]);
    mockGetDelegatedResource.mockResolvedValue(new BigNumber(0));
  });

  it("accepts a valid native send", async () => {
    const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)]);
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1_000_000n);
    expect(result.estimatedFees).toBe(270_000n);
    expect(result.totalSpent).toBe(1_270_000n);
  });

  it("uses customFees when provided", async () => {
    const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)], {
      value: 500_000n,
    });
    expect(result.estimatedFees).toBe(500_000n);
  });

  it("skips the estimation when customFees already carry their own parameters", async () => {
    const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)], {
      value: 500_000n,
      parameters: { energyRequired: "0", energyAvailable: "0" },
    });

    expect(result.estimatedFees).toBe(500_000n);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("still estimates a TRC-20 send when customFees carry no resource figures", async () => {
    // `getTransactionStatus` fills `parameters` from its own fixed fee-field list, so the bag is
    // always present and never carries the breakdown. Treating it as a real breakdown both suppressed
    // the estimate (dropping the energy warning) and fed `undefined` to `BigInt()`, crashing
    // `getTransactionStatus` for any TRC-20 send with a custom fee.
    const intent = makeIntent({ asset: { type: "trc20", assetReference: TRC20_ADDRESS } });
    const result = await validateIntent(
      mockConfig,
      intent,
      [nativeBalance(10_000_000n), trc20Balance(5n)],
      {
        value: 500_000n,
        parameters: { feesStrategy: "medium" },
      },
    );

    expect(result.estimatedFees).toBe(500_000n);
    expect(mockEstimateFees).toHaveBeenCalled();
  });

  it("skips the estimation for a native send whose fee the caller already supplied", async () => {
    // Only the TRC-20 energy warning reads the breakdown, so on every other asset an estimate whose
    // value `customFees` overrides is several RPC calls for a result nothing reads.
    const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)], {
      value: 500_000n,
      parameters: { feesStrategy: "medium" },
    });

    expect(result.estimatedFees).toBe(500_000n);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  it("does not crash on a TRC-20 send whose customFees carry no breakdown", async () => {
    const intent = makeIntent({
      asset: { type: "trc20", assetReference: "contract-address" },
    });

    const result = await validateIntent(mockConfig, intent, [nativeBalance(10_000_000n)], {
      value: 500_000n,
      parameters: { feesStrategy: "medium" },
    });

    expect(result.estimatedFees).toBe(500_000n);
  });

  describe("recipient validation", () => {
    it("rejects an empty recipient", async () => {
      const result = await validateIntent(mockConfig, makeIntent({ recipient: "" }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects when sender equals recipient", async () => {
      const result = await validateIntent(mockConfig, makeIntent({ recipient: SENDER }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("rejects a malformed recipient address", async () => {
      mockValidateAddress.mockResolvedValueOnce(false);
      const result = await validateIntent(
        mockConfig,
        makeIntent({ recipient: "not-a-real-address" }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });

  describe("native amount validation", () => {
    it("rejects a zero amount when not useAllAmount", async () => {
      const result = await validateIntent(mockConfig, makeIntent({ amount: 0n }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("rejects when balance is insufficient for amount + fees", async () => {
      const result = await validateIntent(mockConfig, makeIntent({ amount: 10_000_000n }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("subtracts locked balance from available", async () => {
      const balances: Balance[] = [
        { value: 10_000_000n, locked: 9_000_000n, asset: { type: "native" } },
      ];
      const result = await validateIntent(mockConfig, makeIntent({ amount: 1_500_000n }), balances);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("computes amount = available - fees when useAllAmount", async () => {
      const result = await validateIntent(
        mockConfig,
        makeIntent({ amount: 0n, useAllAmount: true }),
        [nativeBalance(10_000_000n)],
      );
      expect(result.errors).toEqual({});
      expect(result.amount).toBe(9_730_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });

    it("surfaces NotEnoughBalance and NotEnoughGas when useAllAmount but fees exceed balance", async () => {
      const result = await validateIntent(
        mockConfig,
        makeIntent({ amount: 0n, useAllAmount: true }),
        [nativeBalance(100_000n)],
      );
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
      const result = await validateIntent(mockConfig, tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors).toEqual({});
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("rejects when token balance is insufficient", async () => {
      const result = await validateIntent(mockConfig, tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(500n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("surfaces fee shortfall on gasLimit (NotEnoughGas), not on amount, for token sends", async () => {
      const result = await validateIntent(mockConfig, tokenIntent, [
        nativeBalance(100n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
      expect(result.errors.amount).toBeUndefined();
    });

    it("sets amount = full token balance when useAllAmount", async () => {
      const result = await validateIntent(
        mockConfig,
        { ...tokenIntent, amount: 0n, useAllAmount: true },
        [nativeBalance(10_000_000n), trc20Balance(7_500_000n)],
      );
      expect(result.amount).toBe(7_500_000n);
    });

    it("warns when the transfer needs more energy than the account has", async () => {
      mockEstimateFees.mockResolvedValue({
        value: 3_000_000n,
        parameters: {
          energyRequired: "64285",
          energyAvailable: "0",
          bandwidthRequired: "350",
          bandwidthAvailable: "5000",
          energyEstimated: true,
        },
      });

      const result = await validateIntent(mockConfig, tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(5_000_000n),
      ]);

      expect(result.warnings.amount).toBeInstanceOf(TronNotEnoughEnergy);
    });

    it("still warns about the energy shortfall when the caller supplies a custom fee", async () => {
      mockEstimateFees.mockResolvedValue({
        value: 3_000_000n,
        parameters: {
          energyRequired: "64285",
          energyAvailable: "0",
          bandwidthRequired: "350",
          bandwidthAvailable: "5000",
          energyEstimated: true,
        },
      });

      const result = await validateIntent(
        mockConfig,
        tokenIntent,
        [nativeBalance(10_000_000n), trc20Balance(5_000_000n)],
        { value: 5_000_000n, parameters: { feesStrategy: "medium" } },
      );

      expect(result.estimatedFees).toBe(5_000_000n);
      expect(result.warnings.amount).toBeInstanceOf(TronNotEnoughEnergy);
    });

    it("does not warn about energy when the account's staked energy covers it", async () => {
      mockEstimateFees.mockResolvedValue({
        value: 0n,
        parameters: {
          energyRequired: "31895",
          energyAvailable: "100000",
          bandwidthRequired: "350",
          bandwidthAvailable: "5000",
          energyEstimated: true,
        },
      });

      const result = await validateIntent(mockConfig, tokenIntent, [
        nativeBalance(0n),
        trc20Balance(5_000_000n),
      ]);

      expect(result.warnings.amount).toBeUndefined();
      // A fully resource-covered transfer owes no TRX, so a zero TRX balance is not a gas error.
      expect(result.errors.gasLimit).toBeUndefined();
    });
  });

  describe("fee warning", () => {
    it("warns with the formatted fee amount when a fee is owed", async () => {
      const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)]);

      expect(result.warnings.fee).toBeInstanceOf(TronUnexpectedFees);
      // formatCurrencyUnit separates amount and code with a non-breaking space, hence the \s.
      expect((result.warnings.fee as unknown as { fees: string }).fees).toMatch(/^0\.27\sTRX$/);
    });

    it("does not warn when the transaction is free", async () => {
      mockEstimateFees.mockResolvedValue({ value: 0n });

      const result = await validateIntent(mockConfig, makeIntent(), [nativeBalance(10_000_000n)]);

      expect(result.warnings.fee).toBeUndefined();
    });

    it("skips estimation entirely once a recipient error is known", async () => {
      const result = await validateIntent(mockConfig, makeIntent({ recipient: "" }), [
        nativeBalance(10_000_000n),
      ]);

      expect(mockEstimateFees).not.toHaveBeenCalled();
      expect(result.estimatedFees).toBe(0n);
    });
  });

  describe("locked balance", () => {
    it("does not let frozen TRX pay the fee", async () => {
      const result = await validateIntent(
        mockConfig,
        makeIntent({ amount: 0n, useAllAmount: true }),
        [{ value: 10_000_000n, locked: 9_900_000n, asset: { type: "native" } }],
      );

      // Available is 100_000, below the 270_000 fee.
      expect(result.amount).toBe(0n);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
    });
  });

  describe("staking modes", () => {
    it("does not require a recipient for freeze", async () => {
      const result = await validateIntent(
        mockConfig,
        makeStakingIntent("freeze", { resource: "BANDWIDTH" }, { amount: 5_000_000n }),
        [nativeBalance(10_000_000n)],
      );

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(5_000_000n);
    });

    it.each(["vote", "claimReward", "withdrawExpireUnfreeze", "unfreeze"])(
      "does not require a recipient for %s",
      async mode => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            tronPower: 10,
            votes: [{ name: "sr", address: SR_ADDRESS, voteCount: 1 }],
            unwithdrawnReward: new BigNumber(1_000),
            frozen: { bandwidth: { amount: new BigNumber(10_000_000) }, energy: undefined },
            unFrozen: {
              bandwidth: [{ amount: new BigNumber(1_000), expireTime: daysFromNow(-1) }],
              energy: undefined,
            },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent(mode, {
            resource: "BANDWIDTH",
            votes: [{ name: "sr", address: SR_ADDRESS, voteCount: 1 }],
          }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.recipient).toBeUndefined();
      },
    );

    it("rejects a freeze below 1 TRX", async () => {
      const result = await validateIntent(
        mockConfig,
        makeStakingIntent("freeze", { resource: "BANDWIDTH" }, { amount: 999_999n }),
        [nativeBalance(10_000_000n)],
      );

      expect(result.errors.amount).toBeInstanceOf(TronInvalidFreezeAmount);
    });

    it("reports amount 0 and no fee spend for a non-spending mode", async () => {
      mockFetchTronResources.mockResolvedValue(
        makeResources({ unwithdrawnReward: new BigNumber(5_000) }),
      );

      const result = await validateIntent(mockConfig, makeStakingIntent("claimReward"), [
        nativeBalance(10_000_000n),
      ]);

      expect(result.amount).toBe(0n);
      // Only the fee leaves the account.
      expect(result.totalSpent).toBe(270_000n);
    });

    describe("unfreeze", () => {
      it("rejects unfreezing more bandwidth than is frozen", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            frozen: { bandwidth: { amount: new BigNumber(1_000_000) }, energy: undefined },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("unfreeze", { resource: "BANDWIDTH" }, { amount: 2_000_000n }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForBandwidth);
      });

      it("rejects unfreezing more energy than is frozen", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            frozen: { bandwidth: undefined, energy: { amount: new BigNumber(1_000_000) } },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("unfreeze", { resource: "ENERGY" }, { amount: 2_000_000n }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForEnergy);
      });
    });

    describe("legacyUnfreeze", () => {
      it("rejects when the legacy freeze has not expired yet", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            legacyFrozen: {
              bandwidth: { amount: new BigNumber(1_000_000), expiredAt: daysFromNow(2) },
              energy: undefined,
            },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronLegacyUnfreezeNotExpired);
      });

      it("accepts an expired legacy freeze", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            legacyFrozen: {
              bandwidth: { amount: new BigNumber(1_000_000), expiredAt: daysFromNow(-1) },
              energy: undefined,
            },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeUndefined();
      });

      it("rejects when nothing is frozen under the legacy scheme", async () => {
        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("legacyUnfreeze", { resource: "ENERGY" }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronNoFrozenForEnergy);
      });
    });

    describe("withdrawExpireUnfreeze", () => {
      it("rejects when nothing is unfreezing", async () => {
        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("withdrawExpireUnfreeze"),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronNoUnfrozenResource);
      });

      it("rejects with the closest expiry when none has elapsed", async () => {
        const soonest = daysFromNow(3);
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            unFrozen: {
              bandwidth: [{ amount: new BigNumber(1_000), expireTime: daysFromNow(10) }],
              energy: [{ amount: new BigNumber(1_000), expireTime: soonest }],
            },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("withdrawExpireUnfreeze"),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronUnfreezeNotExpired);
        expect(result.errors.resource).toMatchObject({ time: soonest.toISOString() });
      });

      it("accepts when at least one unfreeze has elapsed", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            unFrozen: {
              bandwidth: [{ amount: new BigNumber(1_000), expireTime: daysFromNow(-1) }],
              energy: [{ amount: new BigNumber(1_000), expireTime: daysFromNow(10) }],
            },
          }),
        );

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("withdrawExpireUnfreeze"),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeUndefined();
      });
    });

    describe("claimReward", () => {
      it("rejects when there is nothing to claim", async () => {
        const result = await validateIntent(mockConfig, makeStakingIntent("claimReward"), [
          nativeBalance(10_000_000n),
        ]);

        expect(result.errors.reward).toBeInstanceOf(TronNoReward);
      });

      it("rejects within 24h of the last withdrawal, reporting when it unlocks", async () => {
        const lastWithdrawn = new Date(Date.now() - 60 * 60 * 1000);
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            unwithdrawnReward: new BigNumber(5_000),
            lastWithdrawnRewardDate: lastWithdrawn,
          }),
        );

        const result = await validateIntent(mockConfig, makeStakingIntent("claimReward"), [
          nativeBalance(10_000_000n),
        ]);

        expect(result.errors.reward).toBeInstanceOf(TronRewardNotAvailable);
        expect(result.errors.reward).toMatchObject({
          until: new Date(lastWithdrawn.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      });

      it("accepts once 24h have passed", async () => {
        mockFetchTronResources.mockResolvedValue(
          makeResources({
            unwithdrawnReward: new BigNumber(5_000),
            lastWithdrawnRewardDate: daysFromNow(-2),
          }),
        );

        const result = await validateIntent(mockConfig, makeStakingIntent("claimReward"), [
          nativeBalance(10_000_000n),
        ]);

        expect(result.errors.reward).toBeUndefined();
      });
    });

    describe("vote", () => {
      const withPower = (tronPower: number) =>
        mockFetchTronResources.mockResolvedValue(makeResources({ tronPower }));

      it("rejects an empty vote list", async () => {
        withPower(10);

        const result = await validateIntent(mockConfig, makeStakingIntent("vote", { votes: [] }), [
          nativeBalance(10_000_000n),
        ]);

        expect(result.errors.vote).toBeInstanceOf(TronVoteRequired);
      });

      it("rejects a vote for an address that is not a super representative", async () => {
        withPower(10);

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("vote", {
            votes: [{ name: "impostor", address: RECIPIENT, voteCount: 1 }],
          }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.vote).toBeInstanceOf(InvalidAddress);
      });

      it("rejects a non-positive vote count", async () => {
        withPower(10);

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("vote", { votes: [{ name: "sr", address: SR_ADDRESS, voteCount: 0 }] }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.vote).toBeInstanceOf(TronInvalidVoteCount);
      });

      it("rejects voting more than the account's Tron Power", async () => {
        withPower(5);

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("vote", { votes: [{ name: "sr", address: SR_ADDRESS, voteCount: 6 }] }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.vote).toBeInstanceOf(TronNotEnoughTronPower);
      });

      it("accepts votes within the account's Tron Power", async () => {
        withPower(10);

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent("vote", { votes: [{ name: "sr", address: SR_ADDRESS, voteCount: 7 }] }),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.vote).toBeUndefined();
      });
    });

    describe("unDelegateResource", () => {
      it("rejects reclaiming more than was delegated to the recipient", async () => {
        mockGetDelegatedResource.mockResolvedValue(new BigNumber(1_000_000));

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent(
            "unDelegateResource",
            { resource: "BANDWIDTH" },
            { recipient: RECIPIENT, amount: 2_000_000n },
          ),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors.resource).toBeInstanceOf(TronInvalidUnDelegateResourceAmount);
      });

      it("accepts reclaiming up to the delegated amount", async () => {
        mockGetDelegatedResource.mockResolvedValue(new BigNumber(2_000_000));

        const result = await validateIntent(
          mockConfig,
          makeStakingIntent(
            "unDelegateResource",
            { resource: "BANDWIDTH" },
            { recipient: RECIPIENT, amount: 2_000_000n },
          ),
          [nativeBalance(10_000_000n)],
        );

        expect(result.errors).toEqual({});
        // Undelegating moves nothing out of the account, so only the fee is spent.
        expect(result.amount).toBe(0n);
      });
    });
  });
});
