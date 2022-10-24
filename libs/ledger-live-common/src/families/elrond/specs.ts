import type { Transaction } from "../../families/elrond/types";
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
} from "./speculos-deviceActions";
import { sample } from "lodash";
import { SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { MIN_DELEGATION_AMOUNT } from "./constants";

const currency = getCryptoCurrencyById("elrond");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");
const maxAccounts = 6;

const ELROND_MIN_ACTIVATION_SAFE = new BigNumber(10000);

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

function expectCorrectOptimisticOperation(
  input: TransactionTestInput<Transaction>
) {
  const { operation, optimisticOperation } = input;

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
    delete opExpected.receivers;
    delete opExpected.contract;
  }

  botTest("optimistic operation matches", () =>
    expect(toOperationRaw(operation)).toMatchObject(opExpected)
  );
}

function expectCorrectSpendableBalanceChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.spendableBalance.toNumber()).toBe(
    accountBeforeTransaction.spendableBalance.minus(operation.value).toNumber()
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
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Record<string, any> = toOperationRaw({
      ...optimisticOperation,
    });
    operation.extra = opExpected.extra;
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    botTest("optimistic operation matches", () =>
      expect(toOperationRaw(operation)).toMatchObject(opExpected)
    );
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
        expectCorrectOptimisticOperation(input);
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

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient,
              subAccountId: esdtAccount?.id,
            },
            {
              amount: esdtAccount?.balance.times(Math.random()).integerValue(),
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectOptimisticOperation(input);
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

        const provider =
          "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlllllskf06ky";
        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: provider,
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
      deviceAction: acceptDelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(
          account.balance
            .minus(account.spendableBalance)
            .gt(MIN_DELEGATION_AMOUNT),
          `account don't have any delegations`
        );

        const provider =
          "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlllllskf06ky";
        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: provider,
              mode: "unDelegate",
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
  ],
};

export default {
  elrondSpec,
};
