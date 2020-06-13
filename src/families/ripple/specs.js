// @flow
import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { isAccountEmpty } from "../../account";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";

const currency = getCryptoCurrencyById("ripple");

const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");

const reserve = parseCurrencyUnit(currency.units[0], "20");

const ripple: AppSpec<Transaction> = {
  name: "XRP",
  currency,
  appQuery: {
    model: "nanoS",
    appName: "XRP",
  },
  mutations: [
    {
      name: "move ~50% to another account",
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 3);
        const recipient = sibling.freshAddress;
        let amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();
        if (isAccountEmpty(sibling) && amount.lt(reserve)) {
          invariant(
            maxSpendable.gt(reserve.plus(minAmountCutoff)),
            "not enough funds to send to new account"
          );
          amount = reserve;
        }
        t = bridge.updateTransaction(t, { amount, recipient });
        if (Math.random() > 0.5) {
          t = bridge.updateTransaction(t, { tag: 123 });
        }
        return t;
      },
      test: ({ account, transaction, accountBeforeTransaction, operation }) => {
        if (transaction.tag) {
          expect(operation.extra).toMatchObject({ tag: transaction.tag });
        }
        // can be generalized!
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
    {
      name: "send max to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 3);
        invariant(
          !isAccountEmpty(sibling) ||
            maxSpendable.gt(reserve.plus(minAmountCutoff)),
          "not enough funds to send to new account"
        );
        const recipient = sibling.freshAddress;
        t = bridge.updateTransaction(t, { useAllAmount: true, recipient });
        return t;
      },
      test: ({ account }) => {
        expect(account.balance.toString()).toBe("20");
      },
    },
  ],
};

export default { ripple };
