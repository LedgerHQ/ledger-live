import BigNumber from "bignumber.js";
import { createMockPolkadotContext } from "../test/config.fixture";
import type { PolkadotAccount, PolkadotResources, Transaction } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { EXISTENTIAL_DEPOSIT, MAX_UNLOCKINGS } from "./utils";

const stubIsNewAccount = jest.fn();
const stubIsElectionClosed = jest.fn();
const stubIsControllerAddress = jest.fn();
const stubVerifyValidatorAddresses = jest.fn();
const stubGetStakingProgress = jest.fn();
const stubGetMinimumBondBalance = jest.fn();

jest.mock("../network", () => {
  return {
    isNewAccount: (_config: unknown, addr: string, currencyId: string | undefined) =>
      stubIsNewAccount(addr, currencyId),
    isElectionClosed: () => stubIsElectionClosed(),
    isControllerAddress: (_config: unknown, address: string, currencyId: string | undefined) =>
      stubIsControllerAddress(address, currencyId),
    verifyValidatorAddresses: (
      _config: unknown,
      validators: string[],
      currencyId: string | undefined,
      currentNominations: string[] | undefined,
    ) => stubVerifyValidatorAddresses(validators, currencyId, currentNominations),
    getStakingProgress: () => stubGetStakingProgress(),
    getMinimumBondBalance: () => stubGetMinimumBondBalance(),
  };
});
const apiStubs = [
  stubIsNewAccount,
  stubIsElectionClosed,
  stubIsControllerAddress,
  stubVerifyValidatorAddresses,
  stubGetStakingProgress,
  stubGetMinimumBondBalance,
];

const HOLDER_ADDRESS = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const OTHER_ADDRESS = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const VALIDATOR_ADDRESS = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";
const FEES = new BigNumber(158612606);
const MINIMUM_BOND = new BigNumber(10_000_000_000);
const FEES_SAFETY_BUFFER = new BigNumber(1_000_000_000);
const FUNDED_BALANCE = new BigNumber(100_000_000_000);

const buildResources = (overrides: Partial<PolkadotResources> = {}): PolkadotResources => ({
  controller: undefined,
  stash: undefined,
  nonce: 0,
  lockedBalance: new BigNumber(0),
  unlockedBalance: new BigNumber(0),
  unlockingBalance: new BigNumber(0),
  unlockings: undefined,
  nominations: undefined,
  numSlashingSpans: 0,
  ...overrides,
});

const buildAccount = ({
  spendableBalance = FUNDED_BALANCE,
  resources = {},
}: {
  spendableBalance?: BigNumber;
  resources?: Partial<PolkadotResources>;
} = {}): PolkadotAccount => ({
  ...createFixtureAccount({
    balance: spendableBalance,
    spendableBalance,
    polkadotResources: buildResources(resources),
  }),
  freshAddress: HOLDER_ADDRESS,
});

const buildController = (resources: Partial<PolkadotResources> = {}): PolkadotAccount =>
  buildAccount({
    resources: {
      stash: HOLDER_ADDRESS,
      lockedBalance: new BigNumber(50_000_000_000),
      unlockingBalance: new BigNumber(10_000_000_000),
      ...resources,
    },
  });

const buildStash = (): PolkadotAccount =>
  buildAccount({ resources: { controller: OTHER_ADDRESS } });

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...createFixtureTransaction({
    recipient: OTHER_ADDRESS,
    amount: new BigNumber(10_000_000_000),
    fees: FEES,
  }),
  ...overrides,
});

const names = (record: Record<string, Error | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(record).flatMap(([key, error]) => (error ? [[key, error.name]] : [])),
  );

describe("getTransactionStatus", () => {
  const getTransactionStatus = buildGetTransactionStatus(createMockPolkadotContext());

  const statusOf = async (account: PolkadotAccount, transaction: Transaction) => {
    const status = await getTransactionStatus(account, transaction);
    return {
      errors: names(status.errors),
      warnings: names(status.warnings),
      amount: status.amount.toString(),
      totalSpent: status.totalSpent.toString(),
      estimatedFees: status.estimatedFees.toString(),
    };
  };

  beforeEach(() => {
    apiStubs.forEach(stub => stub.mockReset());
    stubIsNewAccount.mockResolvedValue(false);
    stubIsControllerAddress.mockResolvedValue(false);
    stubVerifyValidatorAddresses.mockResolvedValue([]);
    stubGetStakingProgress.mockResolvedValue({ electionClosed: true });
    stubGetMinimumBondBalance.mockResolvedValue(MINIMUM_BOND);
  });

  describe('in "send" mode', () => {
    it("only calls isNewAccount api", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ mode: "send" });

      await getTransactionStatus(account, transaction);

      expect(stubIsNewAccount).toHaveBeenCalledTimes(1);
      expect(stubIsNewAccount.mock.lastCall[0]).toEqual(transaction.recipient);
      expect(stubIsNewAccount.mock.lastCall[1]).toEqual(account.currency.id);

      expect(stubIsElectionClosed).not.toHaveBeenCalled();
      expect(stubIsControllerAddress).not.toHaveBeenCalled();
      expect(stubVerifyValidatorAddresses).not.toHaveBeenCalled();
    });

    it("[Bug Polkadot] should have no amount error when user have a valid spendable balance", async () => {
      const account = createFixtureAccount({
        spendableBalance: new BigNumber(6705569396),
        balance: new BigNumber(16705569396),
      });
      const transaction = createFixtureTransaction({
        mode: "send",
        fees: new BigNumber(158612606),
        useAllAmount: false,
        amount: new BigNumber(10000000),
      });

      const status = await getTransactionStatus(account, transaction);
      expect(status.errors.amount).toBeUndefined();
    });

    it("accepts a funded transfer to an existing account", async () => {
      expect(await statusOf(buildAccount(), buildTransaction())).toEqual({
        errors: {},
        warnings: {},
        amount: "10000000000",
        totalSpent: "10158612606",
        estimatedFees: "158612606",
      });
    });

    it("requires the recipient", async () => {
      const status = await statusOf(buildAccount(), buildTransaction({ recipient: "" }));

      expect(status.errors).toEqual({ recipient: "RecipientRequired" });
    });

    it("rejects the account itself as recipient", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ recipient: HOLDER_ADDRESS }),
      );

      expect(status.errors).toEqual({
        recipient: "InvalidAddressBecauseDestinationIsAlsoSource",
      });
    });

    it("rejects a recipient that is not an address", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ recipient: "ewrererewrew" }),
      );

      expect(status.errors).toEqual({ recipient: "InvalidAddress" });
    });

    it("does not look the recipient up when its address is invalid", async () => {
      await statusOf(
        buildAccount(),
        buildTransaction({ recipient: "ewrererewrew", amount: EXISTENTIAL_DEPOSIT.minus(1) }),
      );

      expect(stubIsNewAccount).not.toHaveBeenCalled();
    });

    it("requires an amount", async () => {
      const status = await statusOf(buildAccount(), buildTransaction({ amount: new BigNumber(0) }));

      expect(status.errors).toEqual({ amount: "AmountRequired" });
    });

    it("rejects an amount above the spendable balance", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ amount: new BigNumber("1000000000000000") }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("rejects any amount when nothing is spendable", async () => {
      const status = await statusOf(
        buildAccount({ spendableBalance: new BigNumber(0) }),
        buildTransaction({ amount: new BigNumber(1) }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("requires the fees to be loaded", async () => {
      const status = await statusOf(buildAccount(), buildTransaction({ fees: undefined }));

      expect(status.errors).toEqual({ fees: "FeeNotLoaded" });
    });

    it("rejects an amount below the existential deposit sent to a new account", async () => {
      stubIsNewAccount.mockResolvedValue(true);

      const status = await statusOf(
        buildAccount(),
        buildTransaction({ amount: EXISTENTIAL_DEPOSIT.minus(1) }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalanceBecauseDestinationNotCreated" });
    });

    it("accepts the existential deposit sent to a new account", async () => {
      stubIsNewAccount.mockResolvedValue(true);

      const status = await statusOf(
        buildAccount(),
        buildTransaction({ amount: EXISTENTIAL_DEPOSIT }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "10000000000",
        totalSpent: "10158612606",
        estimatedFees: "158612606",
      });
    });

    it("sends the spendable balance minus the fees when using all the amount", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "99841387394",
        totalSpent: "100000000000",
        estimatedFees: "158612606",
      });
    });

    it("warns that all the funds are spent when using all the amount with locked funds", async () => {
      const status = await statusOf(
        buildAccount({ resources: { lockedBalance: new BigNumber(1_000_000_000) } }),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status.warnings).toEqual({ amount: "PolkadotAllFundsWarning" });
    });

    it("warns when the remaining balance falls under the fees safety buffer with locked funds", async () => {
      const account = buildAccount({ resources: { lockedBalance: new BigNumber(1_000_000_000) } });
      const amount = FUNDED_BALANCE.minus(FEES).minus(FEES_SAFETY_BUFFER.minus(1));

      const status = await statusOf(account, buildTransaction({ amount }));

      expect(status).toEqual({
        errors: {},
        warnings: { amount: "PolkadotAllFundsWarning" },
        amount: amount.toString(),
        totalSpent: amount.plus(FEES).toString(),
        estimatedFees: "158612606",
      });
    });

    it("does not warn when the remaining balance covers the fees safety buffer with locked funds", async () => {
      const account = buildAccount({ resources: { lockedBalance: new BigNumber(1_000_000_000) } });
      const amount = FUNDED_BALANCE.minus(FEES).minus(FEES_SAFETY_BUFFER);

      const status = await statusOf(account, buildTransaction({ amount }));

      expect(status.warnings).toEqual({});
    });
  });

  describe('in "bond" mode', () => {
    it("accepts a first bond to a new controller", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", amount: MINIMUM_BOND }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "10000000000",
        totalSpent: "10158612606",
        estimatedFees: "158612606",
      });
    });

    it("requires a controller on the first bond", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", recipient: "" }),
      );

      expect(status.errors).toEqual({ recipient: "RecipientRequired" });
    });

    it("rejects an invalid controller address on the first bond", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", recipient: "not a valid address" }),
      );

      expect(status.errors).toEqual({ recipient: "InvalidAddress" });
    });

    it("rejects a recipient that is already a controller on the first bond", async () => {
      stubIsControllerAddress.mockResolvedValue(true);

      const status = await getTransactionStatus(buildAccount(), buildTransaction({ mode: "bond" }));

      expect(status.errors.recipient).toMatchObject({
        name: "PolkadotUnauthorizedOperation",
        message: "Recipient is already a controller",
      });
    });

    it("looks the controller up with the currency of the account", async () => {
      const account = buildAccount();

      await statusOf(account, buildTransaction({ mode: "bond" }));

      expect(stubIsControllerAddress).toHaveBeenCalledWith(OTHER_ADDRESS, account.currency.id);
    });

    it("does not validate the recipient when an existing stash bonds extra", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "bond", recipient: "" }),
      );

      expect(status.errors).toEqual({});
    });

    it("rejects an amount below the minimum bond", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", amount: new BigNumber(1_000_000) }),
      );

      expect(status.errors).toEqual({ amount: "PolkadotBondMinimumAmount" });
    });

    it("requires an amount", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", amount: new BigNumber(0) }),
      );

      expect(status.errors).toEqual({ amount: "AmountRequired" });
    });

    it("rejects an amount above the spendable balance", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "bond", amount: new BigNumber("2000000000000000000") }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("rejects an amount that leaves less than the fees safety buffer", async () => {
      const amount = FUNDED_BALANCE.minus(FEES).minus(FEES_SAFETY_BUFFER.minus(1));

      const status = await statusOf(buildStash(), buildTransaction({ mode: "bond", amount }));

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("bonds the spendable balance minus the fees and the safety buffer when using all the amount", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "bond", amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "98841387394",
        totalSpent: "99000000000",
        estimatedFees: "158612606",
      });
    });

    it("rejects the transaction when the election is open", async () => {
      stubGetStakingProgress.mockResolvedValue({ electionClosed: false });

      const status = await statusOf(buildAccount(), buildTransaction({ mode: "bond" }));

      expect(status.errors).toEqual({ staking: "PolkadotElectionClosed" });
    });

    it("falls back to a closed election when the staking progress is unavailable", async () => {
      stubGetStakingProgress.mockRejectedValue(new Error("no staking on this network"));

      const status = await statusOf(buildAccount(), buildTransaction({ mode: "bond" }));

      expect(status.errors).toEqual({});
    });

    it("falls back to a null minimum bond when it is unavailable", async () => {
      stubGetMinimumBondBalance.mockRejectedValue(new Error("no staking on this network"));

      const status = await statusOf(
        buildAccount(),
        buildTransaction({ mode: "bond", amount: new BigNumber(1_000_000) }),
      );

      expect(status.errors).toEqual({});
    });
  });

  describe('in "unbond" mode', () => {
    it("accepts unbonding part of the bonded balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(20_000_000_000) }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "20000000000",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("requires an amount", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(0) }),
      );

      expect(status.errors).toEqual({ amount: "AmountRequired" });
    });

    it("rejects an amount above the bonded balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber("2000000000000000") }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("warns when the remaining bond would fall under the minimum bond", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(35_000_000_000) }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: { amount: "PolkadotBondMinimumAmountWarning" },
        amount: "35000000000",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("does not warn when the whole bond is unbonded", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(40_000_000_000) }),
      );

      expect(status.warnings).toEqual({});
    });

    it("unbonds the whole bonded balance when using all the amount", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "40000000000",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("rejects an account that is not a controller", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "unbond", amount: new BigNumber(1_000) }),
      );

      expect(status.errors).toEqual({
        staking: "PolkadotUnauthorizedOperation",
        amount: "NotEnoughBalance",
      });
    });

    it("rejects a controller without bonded balance", async () => {
      const status = await statusOf(
        buildController({ lockedBalance: new BigNumber(0), unlockingBalance: new BigNumber(0) }),
        buildTransaction({ mode: "unbond", amount: new BigNumber(100_000) }),
      );

      expect(status.errors).toEqual({
        staking: "PolkadotUnauthorizedOperation",
        amount: "NotEnoughBalance",
      });
    });

    it("rejects a controller that reached the maximum number of unlockings", async () => {
      const unlockings = Array.from({ length: MAX_UNLOCKINGS }, () => ({
        amount: new BigNumber(1),
        completionDate: new Date("2030-01-01"),
      }));

      const status = await statusOf(
        buildController({ unlockings }),
        buildTransaction({ mode: "unbond", amount: new BigNumber(1_000) }),
      );

      expect(status.errors).toEqual({ unbondings: "PolkadotMaxUnbonding" });
    });

    it("rejects the fees when they exceed the spendable balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({
          mode: "unbond",
          amount: new BigNumber(1_000),
          fees: FUNDED_BALANCE.plus(1),
        }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });
  });

  describe('in "rebond" mode', () => {
    it("accepts rebonding part of the unlocking balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "rebond", amount: new BigNumber(5_000_000_000) }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "5000000000",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("requires an amount", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "rebond", amount: new BigNumber(0) }),
      );

      expect(status.errors).toEqual({ amount: "AmountRequired" });
    });

    it("rejects an amount above the unlocking balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "rebond", amount: new BigNumber(10_000_000_001) }),
      );

      expect(status.errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("warns when the rebonded amount stays under the minimum bond", async () => {
      const status = await statusOf(
        buildController({ lockedBalance: new BigNumber(10_000_000_000) }),
        buildTransaction({ mode: "rebond", amount: new BigNumber(1_000_000_000) }),
      );

      expect(status.warnings).toEqual({ amount: "PolkadotBondMinimumAmountWarning" });
    });

    it("rebonds the whole unlocking balance when using all the amount", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "rebond", amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status).toEqual({
        errors: {},
        warnings: {},
        amount: "10000000000",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("rejects an account that is not a controller", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "rebond", amount: new BigNumber(1_000) }),
      );

      expect(status.errors).toEqual({
        staking: "PolkadotUnauthorizedOperation",
        amount: "NotEnoughBalance",
      });
    });
  });

  describe('in "withdrawUnbonded" mode', () => {
    it("rejects an account that is not a controller", async () => {
      const status = await statusOf(buildStash(), buildTransaction({ mode: "withdrawUnbonded" }));

      expect(status.errors).toEqual({
        staking: "PolkadotUnauthorizedOperation",
        amount: "PolkadotNoUnlockedBalance",
      });
    });

    it("rejects a controller without unlocked balance", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "withdrawUnbonded" }),
      );

      expect(status.errors).toEqual({ amount: "PolkadotNoUnlockedBalance" });
    });

    it("accepts a controller with unlocked balance", async () => {
      const status = await statusOf(
        buildController({ unlockedBalance: new BigNumber(1_000_000) }),
        buildTransaction({ mode: "withdrawUnbonded" }),
      );

      expect(status.errors).toEqual({});
    });
  });

  describe('in "nominate" mode', () => {
    it("rejects an account that is not a controller", async () => {
      const status = await statusOf(
        buildStash(),
        buildTransaction({ mode: "nominate", validators: [VALIDATOR_ADDRESS] }),
      );

      expect(status.errors).toEqual({ staking: "PolkadotUnauthorizedOperation" });
    });

    it("requires at least one validator", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "nominate", validators: [] }),
      );

      expect(status.errors).toEqual({ staking: "PolkadotValidatorsRequired" });
    });

    it("rejects addresses that are not validators", async () => {
      stubVerifyValidatorAddresses.mockResolvedValue([VALIDATOR_ADDRESS]);

      const status = await getTransactionStatus(
        buildController(),
        buildTransaction({ mode: "nominate", validators: [VALIDATOR_ADDRESS] }),
      );

      expect(status.errors.staking).toMatchObject({
        name: "PolkadotNotValidator",
        validators: [VALIDATOR_ADDRESS],
      });
    });

    it("verifies the validators against the current nominations", async () => {
      const account = buildController({
        nominations: [
          { address: OTHER_ADDRESS, value: new BigNumber(1), status: "active", isRegistered: true },
        ],
      });

      await statusOf(
        account,
        buildTransaction({ mode: "nominate", validators: [VALIDATOR_ADDRESS] }),
      );

      expect(stubVerifyValidatorAddresses).toHaveBeenCalledWith(
        [VALIDATOR_ADDRESS],
        account.currency.id,
        [OTHER_ADDRESS],
      );
    });

    it("accepts validators that are all verified", async () => {
      const status = await statusOf(
        buildController(),
        buildTransaction({ mode: "nominate", validators: [VALIDATOR_ADDRESS] }),
      );

      expect(status.errors).toEqual({});
    });
  });

  describe('in "chill" mode', () => {
    it("rejects an account that is not a controller", async () => {
      const status = await statusOf(buildStash(), buildTransaction({ mode: "chill" }));

      expect(status.errors).toEqual({ staking: "PolkadotUnauthorizedOperation" });
    });

    it("rejects a controller without nominations", async () => {
      const status = await statusOf(buildController(), buildTransaction({ mode: "chill" }));

      expect(status.errors).toEqual({ staking: "PolkadotNoNominations" });
    });

    it("accepts a controller with nominations", async () => {
      const status = await statusOf(
        buildController({
          nominations: [
            {
              address: VALIDATOR_ADDRESS,
              value: new BigNumber(1),
              status: "active",
              isRegistered: true,
            },
          ],
        }),
        buildTransaction({ mode: "chill" }),
      );

      expect(status.errors).toEqual({});
    });
  });

  describe('in "setController" mode', () => {
    it("rejects an account that is not a stash", async () => {
      const status = await statusOf(buildAccount(), buildTransaction({ mode: "setController" }));

      expect(status.errors).toEqual({ staking: "PolkadotUnauthorizedOperation" });
    });

    it("accepts a stash", async () => {
      const status = await statusOf(buildStash(), buildTransaction({ mode: "setController" }));

      expect(status.errors).toEqual({});
    });
  });

  describe("on an empty transaction", () => {
    it("reports the missing recipient and amount with a zero amount", async () => {
      const status = await statusOf(
        buildAccount(),
        buildTransaction({ recipient: "", amount: new BigNumber(0) }),
      );

      expect(status).toEqual({
        errors: { recipient: "RecipientRequired", amount: "AmountRequired" },
        warnings: {},
        amount: "0",
        totalSpent: "158612606",
        estimatedFees: "158612606",
      });
    });

    it("returns the amount, the total spent and the fees as BigNumber", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "", amount: new BigNumber(0) }),
      );

      expect(
        [status.amount, status.totalSpent, status.estimatedFees].map(BigNumber.isBigNumber),
      ).toEqual([true, true, true]);
    });
  });
});
