import type { Transaction } from "../../families/icon/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import { acceptTransaction } from "./speculos-deviceActions";
import { isAccountEmpty } from "../../account";

const ICON_MIN_SAFE = new BigNumber(1);
const maxAccounts = 6;
const currency = getCryptoCurrencyById("icon");
// Minimum balance required for a new non-ASA account
const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

const checkSendableToEmptyAccount = (amount, recipient) => {
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(
      amount.gt(minBalanceNewAccount),
      "not enough funds to send to new account"
    );
  }
};
const iconSpec: AppSpec<Transaction> = {
  name: "Icon",
  currency: getCryptoCurrencyById("icon"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Icon",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(ICON_MIN_SAFE), "balance is too low");
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
        checkSendableToEmptyAccount(amount, sibling);
        if (!sibling.used && amount.lt(ICON_MIN_SAFE)) {
          invariant(
            account.spendableBalance.gt(ICON_MIN_SAFE),
            "send is too low to activate account"
          );
          amount = ICON_MIN_SAFE;
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
  ],
};

export default {
  iconSpec,
};
