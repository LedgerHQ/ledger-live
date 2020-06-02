// @flow
import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";

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
      test: ({ account, accountBeforeTransaction, operation }) => {
        // can be generalized!
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
    {
      name: "move all of ERC20 tokens to another account",
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.subAccounts, "no erc20 tokens available");
        invariant(
          account.balance.gt(minimalAmount),
          "parent balance is too low"
        );
        const erc20Account = sample(account.subAccounts);
        invariant(erc20Account.balance.gt(0), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings);
        const recipient = sibling.freshAddress;
        t = bridge.updateTransaction(t, {
          useAllAmount: true,
          recipient,
          subAccountId: erc20Account.id,
        });
        return t;
      },
      test: ({ account, transaction }) => {
        if (account.subAccounts) {
          const erc20account = account.subAccounts.find(
            (s) => s.id === transaction.subAccountId
          );

          if (erc20account) {
            expect(erc20account.balance.toString()).toBe("0");
          }
        }
      },
    },
  ],
};

export default { ethereum };
