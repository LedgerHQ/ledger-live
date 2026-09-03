import type {
  Balance,
  Stake,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  NotEnoughGas,
  SolanaAccountNotFunded,
  SolanaMemoIsTooLong,
  SolanaMintAccountNotAllowed,
  SolanaRecipientAccountNotFunded,
  SolanaInvalidValidator,
  SolanaStakeAccountAmountTooLow,
  SolanaStakeAccountIsNotDelegatable,
  SolanaStakeAccountIsNotUndelegatable,
  SolanaStakeAccountNotFound,
  SolanaStakeAccountNothingToWithdraw,
  SolanaStakeAccountValidatorIsUnchangeable,
  SolanaStakeNoStakeAuth,
  SolanaStakeNoWithdrawAuth,
  SolanaTokenAccountHoldsAnotherToken,
  SolanaTokenAccountNotAllowed,
  SolanaTokenNonTransferable,
  SolanaTokenRecipientIsSenderATA,
} from "../../errors";
import { MAX_MEMO_LENGTH } from "../validateMemo";
import { formatAPIValue } from "../../common";
import type { ChainAPI } from "../../network";
import {
  getMaybeMintAccount,
  getMaybeTokenAccount,
  getMaybeTokenMint,
  getMaybeVoteAccount,
} from "../../network/chain/web3";
import { validateIntent as validateIntentRaw } from "../validateIntent";

const SENDER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const RECIPIENT = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

const STAKE_ACC_RENT_EXEMPT = 2_282_880;

// Undelegate + withdraw both cost this; the reserve a fresh stake account needs is twice it.
const UNSTAKE_TX_FEE = 5000;
jest.mock("../estimateFees", () => ({
  estimateTxFee: jest.fn().mockResolvedValue(5000),
}));

jest.mock("../../network/chain/web3", () => ({
  __esModule: true,
  getMaybeTokenMint: jest.fn(),
  // Recipient checks default to "a plain wallet address": neither a token account nor a mint.
  // `FakeAtaAddress` is the associated token account the fake api derives, and it does exist
  // whenever a test says so, so `getTokenRecipient` can read its state.
  getMaybeTokenAccount: jest.fn(async (address: string) =>
    address === "FakeAtaAddress" ? { state: "initialized", extensions: undefined } : undefined,
  ),
  getMaybeMintAccount: jest.fn().mockResolvedValue(undefined),
  // Staking flows resolve the validator on-chain; a known vote account by default.
  getMaybeVoteAccount: jest.fn().mockResolvedValue({ voteAccAddr: "vote-acc" }),
  getStakeAccountMinimumBalanceForRentExemption: jest.fn((api: ChainAPI) =>
    api.getMinimumBalanceForRentExemption(200),
  ),
}));
const mockedGetMaybeTokenMint = getMaybeTokenMint as jest.MockedFunction<typeof getMaybeTokenMint>;
const mockedGetMaybeTokenAccount = getMaybeTokenAccount as jest.MockedFunction<
  typeof getMaybeTokenAccount
>;
const mockedGetMaybeMintAccount = getMaybeMintAccount as jest.MockedFunction<
  typeof getMaybeMintAccount
>;
const mockedGetMaybeVoteAccount = getMaybeVoteAccount as jest.MockedFunction<
  typeof getMaybeVoteAccount
>;
function makeApi(
  stakeMinimumDelegation = 1_000_000_000,
  stakeAccRentExempt: number = STAKE_ACC_RENT_EXEMPT,
): ChainAPI {
  return {
    getStakeMinimumDelegation: jest.fn().mockResolvedValue(stakeMinimumDelegation),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(stakeAccRentExempt),
    // Live lamports of the stake account, read by the withdraw validation.
    getBalance: jest.fn().mockResolvedValue(STAKE_ACC_RENT_EXEMPT + 1_000_000_000),
  } as unknown as ChainAPI;
}

/**
 * Balances carrying one stake account, the shape `getBalance` reports and the only place the
 * staking validations can learn about a position from.
 */
function makeStakeBalances(
  stakeOverrides: Partial<Stake> = {},
  native = 5_000_000_000n,
): Balance[] {
  return [
    ...makeBalances(native),
    {
      value: 1_000_000_000n,
      asset: { type: "native" },
      stake: {
        uid: RECIPIENT,
        address: RECIPIENT,
        state: "active",
        asset: { type: "native" },
        amount: 1_000_000_000n,
        delegate: RECIPIENT,
        actions: [],
        details: {
          canStake: true,
          canWithdraw: true,
          activeAmount: 1_000_000_000,
          lockedReserve: STAKE_ACC_RENT_EXEMPT,
        },
        ...stakeOverrides,
      } as Stake,
    },
  ];
}

type IntentArg = Parameters<typeof validateIntentRaw>[1];
type BalancesArg = Parameters<typeof validateIntentRaw>[2];
type FeesArg = Parameters<typeof validateIntentRaw>[3];

const validateIntent = (
  intent: IntentArg,
  balances: BalancesArg,
  customFees?: FeesArg,
  api?: ChainAPI,
): ReturnType<typeof validateIntentRaw> => {
  // `api` is never optional in production — it comes from `chainAPIFromContext` — so the default
  // stands in for the real one rather than exercising an api-less path.
  const resolvedApi = api ?? (intent.intentType === "staking" ? makeApi() : makeTransferApi());
  return validateIntentRaw(resolvedApi, intent, balances, customFees);
};

/** A funded, plain-wallet recipient — what the transfer cases below assume. */
function makeTransferApi(): ChainAPI {
  return {
    getBalance: jest.fn().mockResolvedValue(1),
    findAssocTokenAccAddress: jest.fn().mockResolvedValue("sender-ata"),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(2_039_280),
  } as unknown as ChainAPI;
}

function makeIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1_000_000_000n,
    asset: { type: "native", name: "Solana" },
    ...overrides,
  };
}

function makeBalances(native = 5_000_000_000n, locked = 890_880n): Balance[] {
  return [{ value: native, asset: { type: "native" }, locked }];
}

describe("validateIntent", () => {
  // A partner-built transaction describes itself; the intent's recipient and amount are
  // placeholders, so validating them would reject a perfectly good payload.
  describe("partner-built transaction", () => {
    const prebuilt = makeIntent({
      recipient: "",
      amount: 0n,
    }) as TransactionIntent & { data: { type: string; raw: string } };
    prebuilt.data = { type: "solana", raw: "AQID" };

    it("reports no error and no warning", async () => {
      const result = await validateIntent(prebuilt, makeBalances(), { value: 5000n });

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
    });

    it("spends exactly the fee", async () => {
      const result = await validateIntent(prebuilt, makeBalances(), { value: 5000n });

      expect(result).toMatchObject({ amount: 0n, estimatedFees: 5000n, totalSpent: 5000n });
    });

    it("still validates a transaction that carries no partner payload", async () => {
      const result = await validateIntent(makeIntent({ recipient: "" }), makeBalances());

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });
  });

  // Recipient lookups default to "a plain wallet address"; individual tests override them.
  beforeEach(() => {
    mockedGetMaybeTokenAccount.mockImplementation(async (address: string) =>
      address === "FakeAtaAddress"
        ? ({ state: "initialized" } as unknown as Awaited<ReturnType<typeof getMaybeTokenAccount>>)
        : undefined,
    );
    mockedGetMaybeMintAccount.mockResolvedValue(undefined);
    mockedGetMaybeVoteAccount.mockResolvedValue({ voteAccAddr: "vote-acc" } as unknown as Awaited<
      ReturnType<typeof getMaybeVoteAccount>
    >);
    mockedGetMaybeTokenMint.mockReset();
  });

  afterEach(() => jest.clearAllMocks());

  it("should return valid result for a basic native transfer", async () => {
    const result = await validateIntent(makeIntent(), makeBalances(), { value: 5000n });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toBe(1_000_000_000n);
    expect(result.estimatedFees).toBe(5000n);
    expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
  });

  it("should error when recipient is missing", async () => {
    const result = await validateIntent(makeIntent({ recipient: "" }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should error when recipient is the sender", async () => {
    const result = await validateIntent(makeIntent({ recipient: SENDER }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should error when recipient is an invalid address", async () => {
    const result = await validateIntent(
      makeIntent({ recipient: "not-a-valid-address!!!" }),
      makeBalances(),
      { value: 5000n },
    );

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should error when amount is zero and not useAllAmount", async () => {
    const result = await validateIntent(makeIntent({ amount: 0n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should error when amount exceeds spendable balance (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 10_000_000_000n }),
      makeBalances(5_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should warn when fee is too high relative to amount", async () => {
    const result = await validateIntent(makeIntent({ amount: 100n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
  });

  it("should compute amount for useAllAmount (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(2_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors).toEqual({});
    const expectedAmount = 2_000_000_000n - 890_880n - 5000n;
    expect(result.amount).toBe(expectedAmount);
    expect(result.totalSpent).toBe(expectedAmount + 5000n);
  });

  it("should return zero amount when useAllAmount and balance insufficient for fees", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(5000n, 0n),
      { value: 10_000n },
    );

    expect(result.amount).toBe(0n);
  });

  it("should default estimatedFees to 0n when no customFees provided", async () => {
    const result = await validateIntent(makeIntent(), makeBalances());

    expect(result.estimatedFees).toBe(0n);
    expect(result.totalSpent).toBe(1_000_000_000n);
  });

  describe("staking intents", () => {
    describe("stake.createAccount", () => {
      function makeStakeIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.createAccount",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 1_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should validate a correct stake.createAccount intent", async () => {
        const result = await validateIntent(makeStakeIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(1_000_000_000n);
        expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
      });

      // Legacy set aside the stake account's rent plus the fees of the eventual undelegate and
      // withdraw (`estimateMaxSpendable.ts`), so the account is never left unable to unstake.
      it("reserves the future undelegate and withdraw fees when sending all", async () => {
        const available = 5_000_000_000n - 890_880n;

        const result = await validateIntent(
          makeStakeIntent({ useAllAmount: true }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(available - 5000n - BigInt(2 * UNSTAKE_TX_FEE));
      });

      it("counts the stake account rent and that reserve against a typed amount", async () => {
        const available = 5_000_000_000n - 890_880n;
        // Just affordable without the reserve and the rent, short once both are counted.
        const amount = available - 5000n - 1n;

        const result = await validateIntent(makeStakeIntent({ amount }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });

      it("should error when recipient is missing", async () => {
        const result = await validateIntent(makeStakeIntent({ recipient: "" }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
      });

      it("should error when recipient is an invalid address", async () => {
        const result = await validateIntent(
          makeStakeIntent({ recipient: "not-valid!!!" }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      });

      it("should error when amount is zero", async () => {
        const result = await validateIntent(makeStakeIntent({ amount: 0n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      });

      it("should error when amount + fees exceed available balance", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 5_000_000_000n }),
          makeBalances(5_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });

      it("should compute max amount for useAllAmount", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(2_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n - 890_880n - 5000n - BigInt(2 * UNSTAKE_TX_FEE));
      });

      it("should clamp amount to 0 when useAllAmount and balance is insufficient", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(1000n, 0n),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should error when amount is below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 999_999_999n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
        expect((result.errors.amount as Error & { minimumAmount?: string })?.minimumAmount).toBe(
          "1 SOL",
        );
      });

      it("should error when useAllAmount yields a value below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(500_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should error when useAllAmount minus rent-exempt drops below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000, STAKE_ACC_RENT_EXEMPT),
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(1_000_500_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should pass when amount is at or above the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 1_000_000_000n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
      });

      it("should fetch the minimum delegation from the chain api", async () => {
        const api = makeApi(2_500_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ amount: 2_000_000_000n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(api.getStakeMinimumDelegation).toHaveBeenCalledTimes(1);
        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should skip getStakeMinimumDelegation when recipient is missing", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "" }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should skip getStakeMinimumDelegation when recipient is invalid", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "not-valid!!!" }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should skip getStakeMinimumDelegation when useAllAmount with missing recipient", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "", amount: 0n, useAllAmount: true }),
          makeBalances(5_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should return validation errors instead of rejecting when getStakeMinimumDelegation would fail and recipient is invalid", async () => {
        const api = {
          getStakeMinimumDelegation: jest.fn().mockRejectedValue(new Error("RPC unreachable")),
        } as unknown as ChainAPI;

        await expect(
          validateIntentRaw(
            api,
            makeStakeIntent({ recipient: "not-valid!!!" }),
            makeBalances(5_000_000_000n, 0n),
            { value: 5000n },
          ),
        ).resolves.toMatchObject({
          errors: { recipient: expect.any(InvalidAddress) },
        });
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("skips the minimum-delegation check when the RPC call fails (best-effort)", async () => {
        const api = {
          getStakeMinimumDelegation: jest.fn().mockRejectedValue(new Error("RPC unreachable")),
        } as unknown as ChainAPI;

        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ amount: 1n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(api.getStakeMinimumDelegation).toHaveBeenCalledTimes(1);
        expect(result.errors).toEqual({});
      });
    });

    describe("stake.delegate", () => {
      function makeDelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.delegate",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          // Delegating carries the stake account as a memo; the recipient is the validator.
          memo: { type: "string", kind: "text", value: RECIPIENT },
          ...overrides,
        } as StakingTransactionIntent;
      }

      const delegatableBalances = (native = 5_000_000_000n) =>
        makeStakeBalances({ state: "inactive" }, native);

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeDelegateIntent(), delegatableBalances(), {
          value: 5000n,
        });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed the liquid balance", async () => {
        const result = await validateIntent(
          makeDelegateIntent(),
          makeStakeBalances({ state: "inactive" }, 10_000n),
          { value: 5000n },
        );

        // Keyed on `fee`: that is what the staking screens render.
        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("stake.undelegate", () => {
      function makeUndelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.undelegate",
          mode: "undelegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: "",
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeStakeBalances(), {
          value: 5000n,
        });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed the liquid balance", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeStakeBalances({}, 3000n), {
          value: 5000n,
        });

        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
      });

      // A fully deactivated stake delegates nothing, so `stake.amount` is 0 while the account still
      // holds its lamports. Subtracting the principal rather than the position's value would count
      // the whole stake account as liquid.
      it("does not let a deactivated stake's lamports pay the fee", async () => {
        const staked = 10_000_000_000n;
        const balances: Balance[] = [
          { value: staked, asset: { type: "native" }, locked: staked },
          {
            value: staked,
            asset: { type: "native" },
            stake: {
              uid: RECIPIENT,
              address: RECIPIENT,
              state: "inactive",
              asset: { type: "native" },
              amount: 0n,
              actions: [],
            },
          },
        ];

        const result = await validateIntent(makeUndelegateIntent(), balances, { value: 5000n });

        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
      });

      // `getBalance` reports the native value as liquid + staked, so comparing the fee against it
      // could never fail: any stake account dwarfs a 5000-lamport fee.
      it("does not let staked lamports pay the fee", async () => {
        const balances = makeStakeBalances({}, 1_000_003_000n);

        const result = await validateIntent(makeUndelegateIntent(), balances, { value: 5000n });

        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("checks the legacy bridge used to run", () => {
      const VOTE_ACC = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

      const delegateIntent = (overrides: Record<string, unknown> = {}) =>
        ({
          intentType: "staking",
          type: "stake.delegate",
          mode: "delegate",
          sender: SENDER,
          recipient: VOTE_ACC,
          valAddress: VOTE_ACC,
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          memo: { type: "string", kind: "text", value: RECIPIENT },
          ...overrides,
        }) as StakingTransactionIntent;

      const undelegateIntent = () =>
        ({
          intentType: "staking",
          type: "stake.undelegate",
          mode: "undelegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: "",
          amount: 0n,
          asset: { type: "native", name: "Solana" },
        }) as StakingTransactionIntent;

      const withdrawIntent = () =>
        makeIntent({
          intentType: "transaction",
          type: "stake.withdraw",
          recipient: RECIPIENT,
          amount: 1_000n,
        } as Partial<TransactionIntent>);

      it("rejects a stake account that is not among the account's positions", async () => {
        const result = await validateIntent(delegateIntent(), makeBalances(), { value: 5000n });

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeAccountNotFound);
      });

      it("rejects an unknown validator", async () => {
        mockedGetMaybeVoteAccount.mockResolvedValue(undefined);

        const result = await validateIntent(
          delegateIntent(),
          makeStakeBalances({ state: "inactive" }),
          { value: 5000n },
        );

        expect(result.errors.voteAccAddr).toBeInstanceOf(SolanaInvalidValidator);
      });

      it("rejects delegating a stake that is already active", async () => {
        const result = await validateIntent(delegateIntent(), makeStakeBalances(), {
          value: 5000n,
        });

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeAccountIsNotDelegatable);
      });

      it("refuses to move a deactivating stake to another validator", async () => {
        const result = await validateIntent(
          delegateIntent(),
          makeStakeBalances({ state: "deactivating", delegate: "AnotherValidator" }),
          { value: 5000n },
        );

        expect(result.errors.stakeAccAddr).toBeInstanceOf(
          SolanaStakeAccountValidatorIsUnchangeable,
        );
      });

      it("accepts reactivating a deactivating stake on the same validator", async () => {
        const result = await validateIntent(
          delegateIntent(),
          makeStakeBalances({ state: "deactivating", delegate: VOTE_ACC }),
          { value: 5000n },
        );

        expect(result.errors.stakeAccAddr).toBeUndefined();
        expect(result.errors.voteAccAddr).toBeUndefined();
      });

      it("rejects delegating without the stake authority", async () => {
        const result = await validateIntent(
          delegateIntent(),
          makeStakeBalances({
            state: "inactive",
            details: { canStake: false, canWithdraw: false },
          }),
          { value: 5000n },
        );

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeNoStakeAuth);
      });

      it("rejects deactivating a stake that is not active", async () => {
        const result = await validateIntent(
          undelegateIntent(),
          makeStakeBalances({ state: "inactive" }),
          { value: 5000n },
        );

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeAccountIsNotUndelegatable);
      });

      it("rejects withdrawing without the withdraw authority", async () => {
        const result = await validateIntent(
          withdrawIntent(),
          makeStakeBalances({ state: "inactive", details: { canWithdraw: false } }),
          { value: 5000n },
        );

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeNoWithdrawAuth);
      });

      it("rejects withdrawing from a stake with nothing free", async () => {
        const result = await validateIntent(withdrawIntent(), makeStakeBalances(), {
          value: 5000n,
        });

        expect(result.errors.stakeAccAddr).toBeInstanceOf(SolanaStakeAccountNothingToWithdraw);
      });
    });

    describe("stake.withdraw", () => {
      function makeWithdrawIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
        return {
          intentType: "transaction",
          type: "stake.withdraw",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 2_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should use the provided amount", async () => {
        // You withdraw from a stake that has finished deactivating, so its whole balance is free.
        const result = await validateIntent(
          makeWithdrawIntent(),
          makeStakeBalances({ state: "inactive" }),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should clamp to 0 when amount is 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ useAllAmount: true, amount: 0n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should clamp negative amount to 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ amount: -1_000n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should error when fees exceed the liquid balance", async () => {
        const result = await validateIntent(makeWithdrawIntent(), makeBalances(3000n, 0n), {
          value: 5000n,
        });

        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
      });

      it("keeps the returned amount clamped to 0 even when errors are set", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ amount: -1_000n }),
          makeBalances(3000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });
    });
  });

  describe("token transfers", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    function makeTokenIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
      return makeIntent({
        asset: { type: "spl-token", assetReference: USDC_MINT, name: "USDC" },
        ...overrides,
      });
    }

    function makeTokenBalances(): Balance[] {
      return [
        { value: 5_000_000_000n, asset: { type: "native" }, locked: 890_880n },
        { value: 10_000_000n, asset: { type: "spl-token", assetReference: USDC_MINT } },
      ];
    }

    function makePartlyFrozenBalances(): Balance[] {
      return [
        { value: 5_000_000_000n, asset: { type: "native" }, locked: 890_880n },
        {
          value: 10_000_000n,
          // 3 USDC sit in a frozen token account and cannot be transferred
          locked: 3_000_000n,
          asset: { type: "spl-token", assetReference: USDC_MINT },
        },
      ];
    }

    describe("recipient checks the legacy bridge used to run", () => {
      // A token account typed in as the destination of a *native* transfer.
      it("rejects a token account when the transfer is not a token transfer", async () => {
        mockedGetMaybeTokenAccount.mockResolvedValueOnce({
          state: "initialized",
        } as unknown as Awaited<ReturnType<typeof getMaybeTokenAccount>>);

        const result = await validateIntent(makeIntent({ amount: 1n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeInstanceOf(SolanaTokenAccountNotAllowed);
      });

      it("rejects a mint address as the recipient", async () => {
        mockedGetMaybeMintAccount.mockResolvedValueOnce(
          {} as unknown as Awaited<ReturnType<typeof getMaybeMintAccount>>,
        );

        const result = await validateIntent(makeIntent({ amount: 1n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeInstanceOf(SolanaMintAccountNotAllowed);
      });

      const unfundedRecipientApi = () =>
        ({
          getBalance: jest.fn().mockResolvedValue(0),
          findAssocTokenAccAddress: jest.fn().mockResolvedValue("FakeAtaAddress"),
          getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(890_880),
        }) as unknown as ChainAPI;

      it("warns when the recipient wallet is not funded, and rejects a dust amount", async () => {
        const result = await validateIntent(
          makeIntent({ amount: 1n }),
          makeBalances(),
          { value: 5000n },
          unfundedRecipientApi(),
        );

        expect(result.errors.recipient).toBeUndefined();
        expect(result.warnings.recipient).toBeInstanceOf(SolanaAccountNotFunded);
        // 1 lamport cannot create the recipient account, which needs the rent-exempt minimum.
        expect(result.errors.amount).toBeInstanceOf(SolanaRecipientAccountNotFunded);
      });

      it("accepts an unfunded recipient when the amount covers its rent", async () => {
        const result = await validateIntent(
          makeIntent({ amount: 890_880n }),
          makeBalances(),
          { value: 5000n },
          unfundedRecipientApi(),
        );

        expect(result.errors.amount).toBeUndefined();
        expect(result.warnings.recipient).toBeInstanceOf(SolanaAccountNotFunded);
      });

      // A real token account address is a PDA, so it is always off the ed25519 curve.
      const OFF_CURVE_TOKEN_ACCOUNT = "35npQR1u7vycmAjRS8H2ozoY7uTXPeZqUCJAm34Kidv1";

      it("reports a non-transferable mint as an error rather than throwing", async () => {
        mockedGetMaybeTokenMint.mockResolvedValue({
          onChainAcc: { data: { program: "spl-token-2022" } },
          info: { extensions: [{ extension: "nonTransferable" }] },
        } as unknown as Awaited<ReturnType<typeof getMaybeTokenMint>>);

        const result = await validateIntent(makeTokenIntent({ amount: 1n }), makeTokenBalances(), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(SolanaTokenNonTransferable);
      });

      // These parsers return an Error to mean "not that kind of account", which must not abort
      // the whole status computation.
      it("treats an unparseable recipient account as a plain address", async () => {
        mockedGetMaybeTokenAccount.mockResolvedValue(new Error("not a token account"));
        mockedGetMaybeMintAccount.mockResolvedValue(new Error("not a mint account"));

        const result = await validateIntent(makeIntent({ amount: 1_000_000n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeUndefined();
      });

      it("rejects a token account that holds another mint", async () => {
        mockedGetMaybeTokenMint.mockResolvedValue({
          onChainAcc: { data: { program: "spl-token" } },
          info: { extensions: [] },
        } as unknown as Awaited<ReturnType<typeof getMaybeTokenMint>>);
        // The recipient is a token account, but for a different mint than the one being sent.
        mockedGetMaybeTokenAccount.mockResolvedValue({
          state: "initialized",
          mint: { toBase58: () => "AnotherMint11111111111111111111111111111111" },
          owner: { toBase58: () => "SomeOwner" },
        } as unknown as Awaited<ReturnType<typeof getMaybeTokenAccount>>);

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n, recipient: OFF_CURVE_TOKEN_ACCOUNT }),
          makeTokenBalances(),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(SolanaTokenAccountHoldsAnotherToken);
      });

      it("rejects sending a token to the sender's own associated token account", async () => {
        mockedGetMaybeTokenMint.mockResolvedValue({
          onChainAcc: { data: { program: "spl-token" } },
          info: { extensions: [] },
        } as unknown as Awaited<ReturnType<typeof getMaybeTokenMint>>);
        const api = {
          getBalance: jest.fn().mockResolvedValue(1),
          findAssocTokenAccAddress: jest.fn().mockResolvedValue(RECIPIENT),
          getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(2_039_280),
        } as unknown as ChainAPI;

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          makeTokenBalances(),
          { value: 5000n },
          api,
        );

        expect(result.errors.recipient).toBeInstanceOf(SolanaTokenRecipientIsSenderATA);
      });

      it("rejects a memo longer than the on-chain limit", async () => {
        const result = await validateIntent(
          makeIntent({
            amount: 1n,
            memo: { type: "string", kind: "text", value: "a".repeat(MAX_MEMO_LENGTH + 1) },
          } as Partial<TransactionIntent>),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.errors.memo).toBeInstanceOf(SolanaMemoIsTooLong);
        expect(result.errors.transaction).toBe(result.errors.memo);
      });
    });

    it("rejects an amount that dips into the frozen share", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 8_000_000n }),
        makePartlyFrozenBalances(),
        { value: 5000n },
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("caps send-max at the unfrozen share", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makePartlyFrozenBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(7_000_000n);
      expect(result.errors).toEqual({});
    });

    it("refuses a send-max when the whole token balance is frozen", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        [
          { value: 5_000_000_000n, asset: { type: "native" }, locked: 890_880n },
          {
            value: 10_000_000n,
            locked: 10_000_000n,
            asset: { type: "spl-token", assetReference: USDC_MINT },
          },
        ],
        { value: 5000n },
      );

      expect(result.amount).toBe(0n);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should validate a basic token transfer", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 1_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(1_000_000n);
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("should error when token amount exceeds balance", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 50_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should compute amount for useAllAmount (token)", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(10_000_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });

    it("should default to 0 when useAllAmount and token not found in balances", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(0n);
    });

    // Lamports against token units is meaningless, and the recipient's ATA rent rides in the fee,
    // so this fired on every first transfer to a given recipient.
    it("never warns that fees are too high on a token transfer", async () => {
      const result = await validateIntent(makeTokenIntent({ amount: 1n }), makeBalances(), {
        value: 2_044_280n,
      });

      expect(result.warnings.feeTooHigh).toBeUndefined();
    });

    describe("native SOL coverage for ATA rent + fee (via api)", () => {
      const FEE = 5000n;
      const CLASSIC_ATA_RENT = 2_039_280n;
      const TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE = 2_157_600n;

      function makeFakeApi(opts: {
        ataExists: boolean;
        rentLamports?: number;
        rentByDataLength?: Record<number, number>;
      }): ChainAPI {
        return {
          findAssocTokenAccAddress: jest.fn(async () => "FakeAtaAddress"),
          getBalance: jest.fn(async () => (opts.ataExists ? 1n : 0n)),
          getMinimumBalanceForRentExemption: jest.fn(async (dataLength: number) => {
            if (opts.rentByDataLength && dataLength in opts.rentByDataLength) {
              return opts.rentByDataLength[dataLength];
            }
            if (opts.rentLamports !== undefined) return opts.rentLamports;
            throw new Error(`unexpected dataLength ${dataLength} in test`);
          }),
        } as unknown as ChainAPI;
      }

      function makeMint(program: "spl-token" | "spl-token-2022", extensions: string[] = []) {
        return {
          onChainAcc: { data: { program } },
          info: { extensions: extensions.map(extension => ({ extension })) },
        } as Awaited<ReturnType<typeof getMaybeTokenMint>>;
      }

      function balancesWithNative(nativeValue: bigint, locked: bigint = 890_880n): Balance[] {
        return [
          { value: nativeValue, asset: { type: "native" }, locked },
          { value: 10_000_000n, asset: { type: "spl-token", assetReference: USDC_MINT } },
        ];
      }

      beforeEach(() => {
        mockedGetMaybeTokenMint.mockReset();
      });

      // `estimateFees` sizes the rent from the mint and folds it into the fee; this only checks
      // that the fee it hands over is what the coverage check compares against.
      it("packs NotEnoughGas when spendable cannot cover the fee the estimation reported", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(
          makeMint("spl-token-2022", ["transferFeeConfig"]),
        );
        const api = makeFakeApi({ ataExists: false, rentByDataLength: {} });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(2_935_160n),
          { value: TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
        // The message interpolates a human-readable amount, not raw lamports.
        expect(result.errors.gasPrice as Error & Record<string, unknown>).toMatchObject({
          fees: formatAPIValue(TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE),
          ticker: "SOL",
          cryptoName: "Solana",
        });
      });

      it("does not pack NotEnoughGas when spendable covers that fee", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(
          makeMint("spl-token-2022", ["transferFeeConfig"]),
        );
        const api = makeFakeApi({ ataExists: false, rentByDataLength: {} });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE + 890_880n),
          { value: TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
      });

      it("packs NotEnoughGas when a classic SPL ATA has to be created and funds fall one short", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({ ataExists: false, rentByDataLength: {} });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(CLASSIC_ATA_RENT + FEE - 1n + 890_880n),
          { value: CLASSIC_ATA_RENT + FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      });

      it("does not require ATA rent when the recipient's ATA already exists", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({
          ataExists: true,
          rentByDataLength: {},
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(FEE + 890_880n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
        expect(api.getMinimumBalanceForRentExemption).not.toHaveBeenCalled();
      });

      it("packs NotEnoughGas when spendable is zero, regardless of fee value", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({
          ataExists: true,
          rentByDataLength: {},
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(890_880n),
          { value: 0n },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      });

      it("skips the native coverage check when recipient address is invalid", async () => {
        const result = await validateIntent(
          makeTokenIntent({ amount: 1n, recipient: "not-a-valid-address" }),
          balancesWithNative(0n),
          { value: FEE },
          makeFakeApi({ ataExists: false, rentByDataLength: {} }),
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
        expect(result.errors.gasPrice).toBeUndefined();
        expect(mockedGetMaybeTokenMint).not.toHaveBeenCalled();
      });

      it("bails out silently when getMaybeTokenMint returns an Error (no gasPrice noise)", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(new Error("network failed") as any);
        const api = makeFakeApi({ ataExists: false, rentByDataLength: {} });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(0n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
      });
    });
  });
});
