import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceFees,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { NotEnoughToRestake, NotEnoughToStake, NotEnoughToUnstake } from "../../errors";
import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
  createFixtureTransaction,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";
import getTransactionStatus from "../../bridge/getTransactionStatus";
import { MIN_COINS_ON_SHARES_POOL } from "../../constants";

const aptosResources = {
  activeBalance: BigNumber(45988443248),
  pendingInactiveBalance: BigNumber(67874023),
  inactiveBalance: BigNumber(567600900),
  stakingPositions: [
    {
      active: BigNumber(123456789),
      inactive: BigNumber(567567567),
      pendingInactive: BigNumber(5345),
      validatorId: "validator-1",
    },
    {
      active: BigNumber(3),
      inactive: BigNumber(33333),
      pendingInactive: BigNumber(67868678),
      validatorId: "validator-2",
    },
    {
      active: BigNumber(45864986459),
      inactive: BigNumber(0),
      pendingInactive: BigNumber(0),
      validatorId: "validator-3",
    },
  ],
};

describe("getTransactionStatus Test", () => {
  it("should return error for AmountRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.fees = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new AmountRequired(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for FeeNotLoaded", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.fees = null;
    transaction.amount = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        fees: new FeeNotLoaded(),
      },
      warnings: {},
      estimatedFees: BigNumber(0),
      amount: BigNumber(2),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance and amount equal to zero with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance for token account when not enough tokens", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    account.spendableBalance = BigNumber(300);

    const transaction = createFixtureTransactionWithSubAccount();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2000);
    transaction.fees = BigNumber(200);

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(200),
      amount: BigNumber(2000),
      totalSpent: BigNumber(2000),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(0),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalance for token account with use all amount option when not enough fees", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransactionWithSubAccount();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2000);
    transaction.fees = BigNumber(200);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(200),
      amount: BigNumber(1000),
      totalSpent: BigNumber(1000),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for NotEnoughBalanceFees", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    account.spendableBalance = BigNumber(1);

    const transaction = createFixtureTransactionWithSubAccount();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(0);
    transaction.errors = { maxGasAmount: "GasInsufficientBalance" };

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalanceFees(),
      },
      warnings: {},
      estimatedFees: BigNumber(0),
      amount: BigNumber(2),
      totalSpent: BigNumber(2),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for RecipientRequired", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for InvalidAddress", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "0x";

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddress(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for InvalidAddressBecauseDestinationIsAlsoSource", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "0x" + "0".repeat(64);
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return error for RecipientRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    transaction.amount = BigNumber(2);
    transaction.fees = BigNumber(2);
    transaction.recipient = "";
    account.freshAddress = transaction.recipient;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
        amount: new NotEnoughBalance(),
      },
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(2),
      totalSpent: BigNumber(4),
    };

    expect(result).toEqual(expected);
  });

  it("should return right amount and total spent with use all amount option", async () => {
    const account = createFixtureAccount();
    account.spendableBalance = BigNumber(10);

    const transaction = createFixtureTransaction();
    transaction.recipient = "0x" + "0".repeat(64);
    transaction.fees = BigNumber(2);
    transaction.useAllAmount = true;

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {},
      warnings: {},
      estimatedFees: BigNumber(2),
      amount: BigNumber(8),
      totalSpent: BigNumber(10),
    };

    expect(result).toEqual(expected);
  });

  it("returns no error and the amount plus the fees as total spent for a valid native send", async () => {
    const account = createFixtureAccount({ spendableBalance: BigNumber(1000) });
    const transaction = createFixtureTransaction({
      recipient: "0x" + "0".repeat(64),
      amount: BigNumber(500),
      fees: BigNumber(100),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: BigNumber(100),
      amount: BigNumber(500),
      totalSpent: BigNumber(600),
    });
  });

  it("returns no error and a total spent equal to the amount for a valid token send", async () => {
    const account = createFixtureAccountWithSubAccount("coin", {
      spendableBalance: BigNumber(300),
    });
    const transaction = createFixtureTransactionWithSubAccount({
      recipient: "0x" + "0".repeat(64),
      amount: BigNumber(500),
      fees: BigNumber(200),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: BigNumber(200),
      amount: BigNumber(500),
      totalSpent: BigNumber(500),
    });
  });

  it("should return not enough balance if trying to stake more than the current balance", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(123456),
      spendableBalance: BigNumber(123456),
    });

    const transaction = createFixtureTransaction({ mode: "stake", amount: BigNumber(123453336) });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it(`should return not enough balance to stake if trying to stake less than ${MIN_COINS_ON_SHARES_POOL} APT`, async () => {
    const account = createFixtureAccount({
      balance: BigNumber(123456),
      spendableBalance: BigNumber(123456),
    });

    const transaction = createFixtureTransaction({ mode: "stake", amount: BigNumber(5) });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughToStake(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it(`should return not enough balance to stake if trying to stake the max balance but it is less than ${MIN_COINS_ON_SHARES_POOL} APT`, async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
    });

    const transaction = createFixtureTransaction({ mode: "stake", useAllAmount: true });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughToStake(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it("should return an error if there's no staking position to restake", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
    });

    const transaction = createFixtureTransaction({ mode: "restake" });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it("should return an error if there's not enough pending inactive balance", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
      aptosResources,
    });

    const transaction = createFixtureTransaction({
      mode: "restake",
      recipient: "validator-1",
      amount: BigNumber(67874022223),
      fees: BigNumber(1),
    });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it(`should return not enough amount if trying to restake but it is less than ${MIN_COINS_ON_SHARES_POOL} APT`, async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
      aptosResources,
    });

    const transaction = createFixtureTransaction({
      mode: "restake",
      recipient: "validator-2",
      amount: BigNumber(4),
      fees: BigNumber(1),
    });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughToRestake(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it("should return an error if there's no staking position to unstake", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
    });

    const transaction = createFixtureTransaction({ mode: "unstake" });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it(`should return not enough to unstake if the amount to unstake is less than ${MIN_COINS_ON_SHARES_POOL} APT`, async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
      aptosResources,
    });

    const transaction = createFixtureTransaction({
      mode: "unstake",
      recipient: "validator-2",
      amount: BigNumber(2),
      fees: BigNumber(0.5),
    });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughToUnstake(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it("should return an error if there's no staking position to withdraw", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
    });

    const transaction = createFixtureTransaction({ mode: "withdraw" });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        recipient: new RecipientRequired(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  it("should return not enough balance if the amount to restake exceeds the pending inactive balance", async () => {
    const account = createFixtureAccount({
      balance: BigNumber(4),
      spendableBalance: BigNumber(4),
      aptosResources,
    });

    const transaction = createFixtureTransaction({
      mode: "restake",
      recipient: "validator-1",
      amount: BigNumber(56756756745),
      fees: BigNumber(1),
    });

    const result = await getTransactionStatus(account, transaction);

    const expected = {
      errors: {
        amount: new NotEnoughBalance(),
      },
    };

    expect(result).toMatchObject(expected);
  });

  describe("staking balance left and withdraw limits", () => {
    const accountWithPosition = (position: {
      active?: BigNumber;
      inactive?: BigNumber;
      pendingInactive?: BigNumber;
    }) =>
      createFixtureAccount({
        aptosResources: {
          ...aptosResources,
          stakingPositions: [
            {
              validatorId: "validator-1",
              active: BigNumber(0),
              inactive: BigNumber(0),
              pendingInactive: BigNumber(0),
              ...position,
            },
          ],
        },
      });

    it("returns RestakeNotEnoughStakedBalanceLeft when the restake leaves less than the minimum pending balance", async () => {
      const account = accountWithPosition({ pendingInactive: BigNumber(2_000_000_000) });
      const transaction = createFixtureTransaction({
        mode: "restake",
        recipient: "validator-1",
        amount: BigNumber(1_200_000_000),
        fees: BigNumber(1),
      });

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.amount).toMatchObject({
        name: "RestakeNotEnoughStakedBalanceLeft",
        maxAmount: "9 APT",
        totalAmount: "20 APT",
      });
    });

    it("returns NotEnoughBalance when the unstake amount exceeds the active stake", async () => {
      const account = accountWithPosition({ active: BigNumber(1_500_000_000) });
      const transaction = createFixtureTransaction({
        mode: "unstake",
        recipient: "validator-1",
        amount: BigNumber(1_500_000_001),
        fees: BigNumber(1),
      });

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors).toEqual({ amount: new NotEnoughBalance() });
    });

    it("returns UnstakeNotEnoughStakedBalanceLeft when the unstake leaves less than the minimum active stake", async () => {
      const account = accountWithPosition({ active: BigNumber(2_000_000_000) });
      const transaction = createFixtureTransaction({
        mode: "unstake",
        recipient: "validator-1",
        amount: BigNumber(1_200_000_000),
        fees: BigNumber(1),
      });

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.amount).toMatchObject({
        name: "UnstakeNotEnoughStakedBalanceLeft",
        maxAmount: "10 APT",
        totalAmount: "20 APT",
      });
    });

    it("returns NotEnoughBalance when the withdraw amount exceeds the inactive balance", async () => {
      const account = accountWithPosition({ inactive: BigNumber(567_567_567) });
      const transaction = createFixtureTransaction({
        mode: "withdraw",
        recipient: "validator-1",
        amount: BigNumber(567_567_568),
        fees: BigNumber(1),
      });

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors).toEqual({ amount: new NotEnoughBalance() });
    });

    it("returns no error when the withdraw amount equals the inactive balance", async () => {
      const account = accountWithPosition({ inactive: BigNumber(567_567_567) });
      const transaction = createFixtureTransaction({
        mode: "withdraw",
        recipient: "validator-1",
        amount: BigNumber(567_567_567),
        fees: BigNumber(1),
      });

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors).toEqual({});
    });
  });
});
