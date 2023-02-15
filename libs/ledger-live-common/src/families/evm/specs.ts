import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { acceptTransaction } from "./speculos-deviceActions";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import type { Transaction } from "./types";

const testTimeout = 6 * 60 * 1000;

const transactionCheck =
  (currencyId: string) =>
  ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(
        parseCurrencyUnit(getCryptoCurrencyById(currencyId).units[0], "1")
      ),
      `${currencyId} balance is too low`
    );
  };

const evmBasicMutations = ({ maxAccount }) => [
  {
    name: "move 50%",
    maxRun: 2,
    testDestination: genericTestDestination,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;
      const amount = maxSpendable.div(2).integerValue();
      return {
        transaction: bridge.createTransaction(account),
        updates: [
          {
            recipient,
            amount,
          },
        ],
      };
    },
    test: ({ account, accountBeforeTransaction, operation, transaction }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 60000,
        "operation time to be older than 60s"
      );
      const estimatedGas = transaction.gasLimit.times(
        transaction.gasPrice || transaction.maxFeePerGas || 0
      );
      botTest("operation fee is not exceeding estimated gas", () =>
        expect(operation.fee.toNumber()).toBeLessThanOrEqual(
          estimatedGas.toNumber()
        )
      );
      botTest("account balance moved with operation value", () =>
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        )
      );
    },
  },
  {
    name: "send max",
    maxRun: 1,
    testDestination: genericTestDestination,
    transaction: ({ account, siblings, bridge }) => {
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;

      return {
        transaction: bridge.createTransaction(account),
        updates: [
          {
            recipient,
          },
          {
            useAllAmount: true,
          },
        ],
      };
    },
    test: ({ account, accountBeforeTransaction, operation, transaction }) => {
      // workaround for buggy explorer behavior (nodes desync)
      invariant(
        Date.now() - operation.date > 60000,
        "operation time to be older than 60s"
      );
      const estimatedGas = transaction.gasLimit.times(
        transaction.gasPrice || transaction.maxFeePerGas || 0
      );
      botTest("operation fee is not exceeding estimated gas", () =>
        expect(operation.fee.toNumber()).toBeLessThanOrEqual(
          estimatedGas.toNumber()
        )
      );
      botTest("account balance moved with operation value", () =>
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        )
      );
    },
  },
  {
    name: "move some ERC20",
    maxRun: 1,
    transaction: ({ account, siblings, bridge }) => {
      const erc20Account = sample(
        (account.subAccounts || []).filter((a) => a.balance.gt(0))
      );
      invariant(erc20Account, "no erc20 account");
      const sibling = pickSiblings(siblings, 3);
      const recipient = sibling.freshAddress;
      return {
        transaction: bridge.createTransaction(account),
        updates: [
          {
            recipient,
            subAccountId: erc20Account.id,
          },
          Math.random() < 0.5
            ? {
                useAllAmount: true,
              }
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
        botTest("erc20 account is empty", () =>
          expect(erc20account.balance.toString()).toBe("0")
        );
      } else {
        botTest("account balance moved with tx amount", () =>
          expect(erc20account.balance.toString()).toBe(
            erc20accountBefore.balance.minus(transaction.amount).toString()
          )
        );
      }
    },
  },
];

const cronos: AppSpec<Transaction> = {
  name: "Cronos",
  currency: getCryptoCurrencyById("cronos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  testTimeout,
  transactionCheck: transactionCheck("cronos"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

const fantom: AppSpec<Transaction> = {
  name: "Fantom",
  currency: getCryptoCurrencyById("fantom"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  testTimeout,
  transactionCheck: transactionCheck("fantom"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

const moonbeam: AppSpec<Transaction> = {
  name: "Moonbeam",
  currency: getCryptoCurrencyById("moonbeam"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  testTimeout,
  transactionCheck: transactionCheck("moonbeam"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

const songbird: AppSpec<Transaction> = {
  name: "Songbird",
  currency: getCryptoCurrencyById("songbird"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  testTimeout,
  transactionCheck: transactionCheck("songbird"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

const flare: AppSpec<Transaction> = {
  name: "Flare",
  currency: getCryptoCurrencyById("flare"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  testTimeout,
  transactionCheck: transactionCheck("flare"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

export default {
  cronos,
  fantom,
  moonbeam,
  songbird,
  flare,
};
