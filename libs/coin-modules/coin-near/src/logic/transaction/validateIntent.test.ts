import type {
  Balance,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { fetchAccountDetails, getActionCosts, getStakingPositions } from "../../network";
import { getYoctoThreshold } from "../../logic";
import { validateIntent } from "./validateIntent";

jest.mock("../../network", () => ({
  fetchAccountDetails: jest.fn(),
  getActionCosts: jest.fn(),
  getStakingPositions: jest.fn(),
}));

const SENDER = "sender.near";
const NAMED_RECIPIENT = "recipient.near";
const IMPLICIT_RECIPIENT = "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";
const VALIDATOR = "astro-stakers.poolv1.near";

const ONE_NEAR = 1_000_000_000_000_000_000_000_000n;
const FEES = { value: 100_000_000_000_000_000_000n };
const ABOVE_THRESHOLD = BigInt(getYoctoThreshold().multipliedBy(3).toFixed(0));

const nativeBalance = (value: bigint, locked = 0n): Balance => ({
  value,
  locked,
  asset: { type: "native" },
});

const stakeBalance = (amount: bigint, state: string): Balance =>
  ({
    value: amount,
    asset: { type: "native" },
    stake: {
      uid: `${SENDER}:${VALIDATOR}:${state}`,
      address: SENDER,
      delegate: VALIDATOR,
      state,
      actions: [],
      asset: { type: "native" },
      amount,
    },
  }) as Balance;

/** exactOptionalPropertyTypes is on, so an explicit `undefined` override needs the union. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

const sendIntent = (overrides: Overrides<TransactionIntent> = {}): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: NAMED_RECIPIENT,
    amount: ONE_NEAR,
    asset: { type: "native" },
    ...overrides,
  }) as TransactionIntent;

const stakingIntent = (
  mode: StakingTransactionIntent["mode"],
  overrides: Overrides<StakingTransactionIntent> = {},
): StakingTransactionIntent =>
  ({
    ...sendIntent(),
    intentType: "staking",
    type: mode,
    mode,
    valAddress: VALIDATOR,
    amount: ABOVE_THRESHOLD,
    ...overrides,
  }) as StakingTransactionIntent;

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActionCosts as unknown as jest.Mock).mockResolvedValue({
      storageCost: new BigNumber("10000000000000000000"),
    });
    (fetchAccountDetails as jest.Mock).mockResolvedValue({ amount: "1", storage_usage: 182 });
  });

  describe("transfers", () => {
    it("accepts a funded transfer to an existing account", async () => {
      const result = await validateIntent(sendIntent(), [nativeBalance(ONE_NEAR * 10n)], FEES);

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(ONE_NEAR);
      expect(result.totalSpent).toBe(ONE_NEAR + FEES.value);
    });

    it("subtracts the locked storage deposit from what can be spent", async () => {
      const result = await validateIntent(
        sendIntent({ amount: ONE_NEAR * 2n }),
        [nativeBalance(ONE_NEAR * 3n, ONE_NEAR * 2n)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("requires a recipient", async () => {
      const result = await validateIntent(
        sendIntent({ recipient: "" }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.recipient?.name).toBe("RecipientRequired");
    });

    it("rejects a malformed recipient", async () => {
      const result = await validateIntent(
        sendIntent({ recipient: "NOT VALID" }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.recipient?.name).toBe("InvalidAddress");
    });

    it("requires a positive amount", async () => {
      const result = await validateIntent(
        sendIntent({ amount: 0n }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("AmountRequired");
    });

    it("warns when sending to yourself", async () => {
      const result = await validateIntent(
        sendIntent({ recipient: SENDER }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.warnings.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
    });

    it("warns that an implicit recipient will be created by the transfer", async () => {
      (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);

      const result = await validateIntent(
        sendIntent({ recipient: IMPLICIT_RECIPIENT }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.warnings.recipient?.name).toBe("NearNewAccountWarning");
      expect(result.errors).toEqual({});
      expect(
        (result.warnings.recipient as unknown as { formattedNewAccountStorageCost: string })
          .formattedNewAccountStorageCost,
      ).toContain("0.00182");
    });

    it("rejects an amount too small to cover a new account's storage", async () => {
      (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);

      const result = await validateIntent(
        sendIntent({ recipient: IMPLICIT_RECIPIENT, amount: 1n }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearActivationFeeNotCovered");
      expect(
        (result.errors.amount as unknown as { formattedNewAccountStorageCost: string })
          .formattedNewAccountStorageCost,
      ).toContain("0.00182");
    });

    it("rejects a named recipient that does not exist yet", async () => {
      (fetchAccountDetails as jest.Mock).mockResolvedValue(undefined);

      const result = await validateIntent(sendIntent(), [nativeBalance(ONE_NEAR * 10n)], FEES);

      expect(result.errors.recipient?.name).toBe("NearNewNamedAccountError");
    });

    it("spends the balance minus fees when sending everything", async () => {
      const result = await validateIntent(
        sendIntent({ useAllAmount: true }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.amount).toBe(ONE_NEAR * 10n - FEES.value);
      expect(result.errors).toEqual({});
    });

    it("recommends unstaking first when sending everything with an open position", async () => {
      const result = await validateIntent(
        sendIntent({ useAllAmount: true }),
        [nativeBalance(ONE_NEAR * 10n), stakeBalance(ABOVE_THRESHOLD, "active")],
        FEES,
      );

      expect(result.warnings.amount?.name).toBe("NearRecommendUnstake");
    });
  });

  describe("staking", () => {
    it("accepts a funded delegation", async () => {
      const result = await validateIntent(
        stakingIntent("delegate"),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors).toEqual({});
      expect(result.totalSpent).toBe(ABOVE_THRESHOLD + FEES.value);
    });

    it("reads the pool when the caller's balances carry no staking entries", async () => {
      (getStakingPositions as jest.Mock).mockResolvedValue({
        stakingPositions: [
          {
            validatorId: VALIDATOR,
            staked: new BigNumber(0),
            available: new BigNumber(ONE_NEAR.toString()),
            pending: new BigNumber(0),
          },
        ],
      });

      const result = await validateIntent(
        stakingIntent("withdraw", { amount: ONE_NEAR / 2n }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(getStakingPositions).toHaveBeenCalledWith(SENDER);
      expect(result.errors).toEqual({});
      expect(result.amount).toBe(ONE_NEAR / 2n);
    });

    it("rejects a withdrawal the pool cannot cover", async () => {
      (getStakingPositions as jest.Mock).mockResolvedValue({
        stakingPositions: [
          {
            validatorId: VALIDATOR,
            staked: new BigNumber(0),
            available: new BigNumber(ABOVE_THRESHOLD.toString()),
            pending: new BigNumber(0),
          },
        ],
      });

      const result = await validateIntent(
        stakingIntent("withdraw", { amount: ONE_NEAR }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearNotEnoughAvailable");
    });

    it("rejects an amount below the staking threshold", async () => {
      const result = await validateIntent(
        stakingIntent("delegate", { amount: 1n }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearStakingThresholdNotMet");
      expect((result.errors.amount as unknown as { threshold: string }).threshold).toMatch(/NEAR$/);
    });

    it("rejects a delegation the liquid balance cannot cover", async () => {
      const result = await validateIntent(
        stakingIntent("delegate", { amount: ONE_NEAR * 100n }),
        [nativeBalance(ONE_NEAR)],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("only spends the fee when unstaking, since the funds are already delegated", async () => {
      const result = await validateIntent(
        stakingIntent("undelegate"),
        [nativeBalance(ONE_NEAR), stakeBalance(ABOVE_THRESHOLD * 2n, "active")],
        FEES,
      );

      expect(result.errors).toEqual({});
      expect(result.totalSpent).toBe(FEES.value);
    });

    it("rejects unstaking more than is delegated to that pool", async () => {
      const result = await validateIntent(
        stakingIntent("undelegate", { amount: ABOVE_THRESHOLD * 5n }),
        [nativeBalance(ONE_NEAR), stakeBalance(ABOVE_THRESHOLD, "active")],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearNotEnoughStaked");
    });

    it("rejects withdrawing more than has been released", async () => {
      const result = await validateIntent(
        stakingIntent("withdraw", { amount: ABOVE_THRESHOLD * 5n }),
        [nativeBalance(ONE_NEAR), stakeBalance(ABOVE_THRESHOLD, "withdrawable")],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearNotEnoughAvailable");
    });

    it("does not count an unbonding position as withdrawable", async () => {
      const result = await validateIntent(
        stakingIntent("withdraw"),
        [nativeBalance(ONE_NEAR), stakeBalance(ABOVE_THRESHOLD, "deactivating")],
        FEES,
      );

      expect(result.errors.amount?.name).toBe("NearNotEnoughAvailable");
    });

    it("rejects staking when the liquid balance cannot even cover the fee", async () => {
      const result = await validateIntent(stakingIntent("delegate"), [nativeBalance(1n)], FEES);

      expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("warns when delegating the entire spendable balance", async () => {
      const result = await validateIntent(
        stakingIntent("delegate", { useAllAmount: true }),
        [nativeBalance(ONE_NEAR * 10n)],
        FEES,
      );

      expect(result.warnings.amount?.name).toBe("NearUseAllAmountStakeWarning");
    });
  });
});
