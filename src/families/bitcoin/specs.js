// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { MutationSpec, AppSpec } from "../../bot/types";

const bitcoinLikeMutations = ({
  minimalAmount = BigNumber("10000"),
  targetAccountSize = 5,
}: $Shape<{
  minimalAmount: BigNumber,
  targetAccountSize: number,
}> = {}): MutationSpec<Transaction>[] => [
  {
    name: "move 50% to another account",
    transaction: ({ account, siblings, bridge }) => {
      invariant(account.balance.gt(minimalAmount), "balance is too low");
      let t = bridge.createTransaction(account);
      const sibling = pickSiblings(siblings, targetAccountSize);
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
    name: "send max to another account",
    transaction: ({ account, siblings, bridge }) => {
      invariant(account.balance.gt(minimalAmount), "balance is too low");
      let t = bridge.createTransaction(account);
      const sibling = pickSiblings(siblings, targetAccountSize);
      const recipient = sibling.freshAddress;
      t = bridge.updateTransaction(t, { useAllAmount: true, recipient });
      return t;
    },
    test: ({ account }) => {
      expect(account.balance.toString()).toBe("0");
    },
  },
];

const bitcoin: AppSpec<Transaction> = {
  name: "Bitcoin",
  currency: getCryptoCurrencyById("bitcoin"),
  appQuery: {
    model: "nanoS",
    appName: "Bitcoin",
  },
  mutations: bitcoinLikeMutations(),
};

const dogecoin: AppSpec<Transaction> = {
  name: "DogeCoin",
  currency: getCryptoCurrencyById("dogecoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Dogecoin",
  },
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("dogecoin").units[0],
      "1"
    ),
  }),
};

// NB at the moment this spec is used to show a bug. LL-2288
const zcash: AppSpec<Transaction> = {
  name: "ZCash",
  currency: getCryptoCurrencyById("zcash"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Zcash",
    appVersion: "1.4",
  },
  mutations: bitcoinLikeMutations({
    targetAccountSize: 1,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("zcash").units[0],
      "0.0002"
    ),
  }),
};

export default { bitcoin, dogecoin, zcash };
