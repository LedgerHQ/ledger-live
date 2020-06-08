// @flow
import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";

const ethereumMutations = ({ maxAccount, minimalAmount }) => [
  {
    name: "move 50% to another account",
    transaction: ({ account, siblings, bridge }) => {
      invariant(account.balance.gt(minimalAmount), "balance is too low");
      let t = bridge.createTransaction(account);
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;
      const amount = account.balance.div(2).integerValue();
      t = bridge.updateTransaction(t, { amount, recipient });
      return t;
    },
    test: ({ account, accountBeforeTransaction, operation }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 20000,
        "operation time to be older than 20s"
      );
      // can be generalized!
      expect(account.balance.toString()).toBe(
        accountBeforeTransaction.balance.minus(operation.value).toString()
      );
    },
  },
  {
    name: "move some ERC20 token to another account",
    transaction: ({ account, siblings, bridge }) => {
      invariant(account.balance.gt(minimalAmount), "eth balance is too low");
      const erc20Account = sample(
        (account.subAccounts || []).filter((a) => a.balance.gt(0))
      );
      invariant(erc20Account, "no erc20 account");
      let t = bridge.createTransaction(account);
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;

      t = bridge.updateTransaction(t, {
        recipient,
        subAccountId: erc20Account.id,
      });
      if (Math.random() < 0.5) {
        t = bridge.updateTransaction(t, {
          useAllAmount: true,
        });
      } else {
        t = bridge.updateTransaction(t, {
          amount: erc20Account.balance.times(Math.random()).integerValue(),
        });
      }
      return t;
    },
    test: ({ accountBeforeTransaction, account, transaction, operation }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 20000,
        "operation time to be older than 20s"
      );
      invariant(accountBeforeTransaction.subAccounts, "sub accounts before");
      const erc20accountBefore = accountBeforeTransaction.subAccounts.find(
        (s) => s.id === transaction.subAccountId
      );
      invariant(erc20accountBefore, "erc20 acc was here before");
      invariant(account.subAccounts, "sub accounts");
      const erc20account = account.subAccounts.find(
        (s) => s.id === transaction.subAccountId
      );
      invariant(erc20account, "erc20 acc is still here");
      if (transaction.useAllAmount) {
        expect(erc20account.balance.toString()).toBe("0");
      } else {
        expect(erc20account.balance.toString()).toBe(
          erc20accountBefore.balance.minus(transaction.amount).toString()
        );
      }
    },
  },
];

const ethereum: AppSpec<Transaction> = {
  name: "Ethereum",
  currency: getCryptoCurrencyById("ethereum"),
  appQuery: {
    model: "nanoS",
    appName: "Ethereum",
  },
  testTimeout: 5 * 60 * 1000,
  mutations: ethereumMutations({
    maxAccount: 3,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("ethereum").units[0],
      "0.003"
    ),
  }),
};

const ethereumClassic = {
  name: "Ethereum Classic",
  currency: getCryptoCurrencyById("ethereum_classic"),
  appQuery: {
    model: "nanoS",
    appName: "Ethereum Classic",
  },
  dependency: "Ethereum",
  mutations: ethereumMutations({
    maxAccount: 4,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("ethereum_classic").units[0],
      "0.01"
    ),
  }),
};

const ethereumRopsten = {
  name: "Ethereum Ropsten",
  currency: getCryptoCurrencyById("ethereum_ropsten"),
  appQuery: {
    model: "nanoS",
    appName: "Ethereum",
  },
  mutations: ethereumMutations({
    maxAccount: 8,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("ethereum_ropsten").units[0],
      "0.01"
    ),
  }),
};

export default {
  ethereum,
  ethereumClassic,
  ethereumRopsten,
};
