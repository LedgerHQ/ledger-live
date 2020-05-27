// @flow
import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import deviceActions from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("ethereum");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.003");

const ethereum: AppSpec<Transaction> = {
  name: "Ethereum",
  currency,
  appQuery: {
    model: "nanoS",
    appName: "Ethereum",
  },
  mutations: [
    {
      name: "move 50% to another account",
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.balance.gt(minimalAmount), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings);
        const recipient = sibling.freshAddress;
        const amount = account.balance.div(2).integerValue();
        t = bridge.updateTransaction(t, { amount, recipient });
        return t;
      },
      deviceAction: deviceActions.acceptTransaction,
      test: ({ account, accountBeforeTransaction, operation }) => {
        // can be generalized!
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
  ],
};

export default { ethereum };
