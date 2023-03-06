import type { Transaction } from "../../families/zilliqa/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import { acceptTransaction } from "./speculos-deviceActions";
import BigNumber from "bignumber.js";

const currency = getCryptoCurrencyById("zilliqa");
const minimalAmount = parseCurrencyUnit(currency.units[0], "1");
const maxAccounts = 6;

const ZILLIQA_MIN_ACTIVATION_SAFE = new BigNumber(2 * 50 * 10 * 2000000000);

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

const zilliqaSpec: AppSpec<Transaction> = {
  name: "Zilliqa",
  currency: getCryptoCurrencyById("zilliqa"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Zilliqa",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 15 * 60 * 1000,
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
    delete opExpected.extra;
    delete opExpected.transactionSequenceNumber;
    botTest("optimistic operation matches", () =>
      expect(toOperationRaw(operation)).toMatchObject(opExpected)
    );
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (!sibling.used && amount.lt(ZILLIQA_MIN_ACTIVATION_SAFE)) {
          invariant(
            account.spendableBalance.gt(ZILLIQA_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
          amount = ZILLIQA_MIN_ACTIVATION_SAFE;
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
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);

        // Checking that miniumum amount is large enough
        let amount = account.spendableBalance;
        if (!sibling.used && amount.lt(ZILLIQA_MIN_ACTIVATION_SAFE)) {
          invariant(
            account.spendableBalance.gt(ZILLIQA_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
          amount = ZILLIQA_MIN_ACTIVATION_SAFE;
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
      name: "send max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);

        // Checking that miniumum amount is large enough
        let amount = account.spendableBalance;
        if (!sibling.used && amount.lt(ZILLIQA_MIN_ACTIVATION_SAFE)) {
          invariant(
            account.spendableBalance.gt(ZILLIQA_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
          amount = ZILLIQA_MIN_ACTIVATION_SAFE;
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
  ],
};

export default {
  zilliqaSpec,
};
