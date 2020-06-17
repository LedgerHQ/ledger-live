// @flow
import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { getGasLimit } from "./transaction";

const ethereumMutations = ({ maxAccount, minimalAmount }) => [
  {
    name: "move 50% to another account",
    transaction: ({ account, siblings, bridge }) => {
      invariant(account.balance.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;
      const amount = account.balance.div(2).integerValue();
      return {
        transaction: bridge.createTransaction(account),
        updates: [{ recipient, amount }],
      };
    },
    test: ({ account, accountBeforeTransaction, operation, transaction }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 60000,
        "operation time to be older than 60s"
      );
      const estimatedGas = getGasLimit(transaction).times(
        transaction.gasPrice || 0
      );
      expect(operation.fee.toNumber()).toBeLessThanOrEqual(
        estimatedGas.toNumber()
      );
      expect(account.balance.toNumber()).toBe(
        accountBeforeTransaction.balance.minus(operation.value).toNumber()
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
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;
      return {
        transaction: bridge.createTransaction(account),
        updates: [
          { recipient, subAccountId: erc20Account.id },
          Math.random() < 0.5
            ? { useAllAmount: true }
            : {
                amount: erc20Account.balance
                  .times(Math.random())
                  .integerValue(),
              },
        ],
      };
    },
    test: ({ accountBeforeTransaction, account, transaction, operation }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 60000,
        "operation time to be older than 60s"
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

const ethereumClassic: AppSpec<Transaction> = {
  name: "Ethereum Classic",
  currency: getCryptoCurrencyById("ethereum_classic"),
  appQuery: {
    model: "nanoS",
    appName: "Ethereum Classic",
  },
  dependency: "Ethereum",
  testTimeout: 5 * 60 * 1000,
  mutations: ethereumMutations({
    maxAccount: 4,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("ethereum_classic").units[0],
      "0.01"
    ),
  }),
};

const ethereumRopsten: AppSpec<Transaction> = {
  name: "Ethereum Ropsten",
  currency: getCryptoCurrencyById("ethereum_ropsten"),
  appQuery: {
    model: "nanoS",
    appName: "Ethereum",
  },
  testTimeout: 5 * 60 * 1000,
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
