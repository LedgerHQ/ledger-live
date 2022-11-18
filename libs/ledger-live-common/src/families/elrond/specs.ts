import type {
  ElrondAccount,
  ElrondResources,
  Transaction,
} from "../../families/elrond/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import {
  acceptDelegateTransaction,
  acceptEsdtTransferTransaction,
  acceptMoveBalanceTransaction,
  acceptUndelegateTransaction,
} from "./speculos-deviceActions";
import BigNumber from "bignumber.js";
import { MIN_DELEGATION_AMOUNT } from "./constants";
import { SubAccount } from "@ledgerhq/types-live";
import { sample } from "lodash";

const currency = getCryptoCurrencyById("elrond");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");
const maxAccounts = 6;

const ELROND_MIN_ACTIVATION_SAFE = new BigNumber(10000);
const UNCAPPED_PROVIDER =
  "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlhllllsr0pd0j";

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;

  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

function expectCorrectEsdtBalanceChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction, transaction } = input;

  const { subAccountId } = transaction;
  const subAccounts = account.subAccounts ?? [];
  const subAccountsBefore = accountBeforeTransaction.subAccounts ?? [];

  const tokenAccount = subAccounts.find((ta) => ta.id === subAccountId);
  const tokenAccountBefore = subAccountsBefore.find(
    (ta) => ta.id === subAccountId
  );

  if (tokenAccount && tokenAccountBefore) {
    expect(tokenAccount.balance.toNumber()).toBe(
      tokenAccountBefore.balance.minus(operation.value).toNumber()
    );
  }
}

function expectCorrectOptimisticOperation(
  input: TransactionTestInput<Transaction>
) {
  const { operation, optimisticOperation, transaction } = input;

  const opExpected: Record<string, any> = toOperationRaw({
    ...optimisticOperation,
  });
  operation.extra = opExpected.extra;
  delete opExpected.value;
  delete opExpected.fee;
  delete opExpected.date;
  delete opExpected.blockHash;
  delete opExpected.blockHeight;

  if (operation.type !== "OUT") {
    delete opExpected.senders;
    delete opExpected.recipients;
    delete opExpected.contract;
  }

  botTest("optimistic operation matches", () => {
    expect(operation.id).toStrictEqual(optimisticOperation.id);
    expect(operation.hash).toStrictEqual(optimisticOperation.hash);
    expect(operation.accountId).toStrictEqual(optimisticOperation.accountId);

    if (!transaction.subAccountId) {
      expect(operation.fee.toFixed()).toStrictEqual(
        optimisticOperation.fee.toFixed()
      );
    }

    expect(operation.type).toStrictEqual(optimisticOperation.type);
    if (operation.type === "OUT") {
      expect(operation.contract).toStrictEqual(optimisticOperation.contract);
      expect(operation.senders).toStrictEqual(optimisticOperation.senders);
      expect(operation.recipients).toStrictEqual(
        optimisticOperation.recipients
      );
      expect(operation.value.toFixed()).toStrictEqual(
        optimisticOperation.value.plus(optimisticOperation.fee).toFixed()
      );
    }

    expect(operation.transactionSequenceNumber).toStrictEqual(
      optimisticOperation.transactionSequenceNumber
    );

    expect(toOperationRaw(operation)).toMatchObject(opExpected);
  });
}

function expectCorrectSpendableBalanceChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction } = input;
  let value = operation.value;
  if (operation.type === "DELEGATE") {
    value = value.plus(new BigNumber(operation.extra.amount));
  }
  expect(account.spendableBalance.toNumber()).toBe(
    accountBeforeTransaction.spendableBalance.minus(value).toNumber()
  );
}

function expectCorrectBalanceFeeChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.fee).toNumber()
  );
}

const elrondSpec: AppSpec<Transaction> = {
  name: "Elrond",
  currency: getCryptoCurrencyById("elrond"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Elrond",
  },
  genericDeviceAction: acceptMoveBalanceTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: minimalAmount,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "balance is too low");
  },
  test: (input) => {
    expectCorrectOptimisticOperation(input);
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
      deviceAction: acceptMoveBalanceTransaction,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (!sibling.used && amount.lt(ELROND_MIN_ACTIVATION_SAFE)) {
          invariant(
            account.spendableBalance.gt(ELROND_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
          amount = ELROND_MIN_ACTIVATION_SAFE;
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
    {
      name: "send max",
      maxRun: 1,
      deviceAction: acceptMoveBalanceTransaction,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);

        if (!sibling.used) {
          invariant(
            account.spendableBalance.gt(ELROND_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
    {
      name: "move some ESDT",
      maxRun: 1,
      deviceAction: acceptEsdtTransferTransaction,
      transaction: ({ account, siblings, bridge }) => {
        const esdtAccount: SubAccount | undefined = sample(
          (account.subAccounts || []).filter((a) => a.balance.gt(0))
        );
        invariant(esdtAccount, "no esdt account");

        invariant(esdtAccount?.balance.gt(0), "esdt balance is 0");

        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        const amount = esdtAccount?.balance.times(Math.random()).integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient,
              subAccountId: esdtAccount?.id,
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectEsdtBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    {
      name: "delegate 1 EGLD",
      maxRun: 1,
      deviceAction: acceptDelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(
          account.spendableBalance.gt(MIN_DELEGATION_AMOUNT),
          `spendable balance is less than minimum delegation amount`
        );

        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: UNCAPPED_PROVIDER,
              mode: "delegate",
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectSpendableBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    {
      name: "unDelegate 1 EGLD",
      maxRun: 1,
      deviceAction: acceptUndelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(
          account.balance
            .minus(account.spendableBalance)
            .gt(MIN_DELEGATION_AMOUNT),
          `account don't have any delegations`
        );
        const elrondAccount = account as ElrondAccount;
        const elrondResources =
          elrondAccount.elrondResources as ElrondResources;
        const delegations = elrondResources.delegations;
        for (const delegation of delegations) {
          invariant(
            new BigNumber(delegation.userActiveStake).gt(0),
            "no active stake for account"
          );
        }

        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: UNCAPPED_PROVIDER,
              mode: "unDelegate",
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectSpendableBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
  ],
};

export default {
  elrondSpec,
};
