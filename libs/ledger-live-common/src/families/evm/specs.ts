import expect from "expect";
import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { acceptTransaction } from "./speculos-deviceActions";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import type { Transaction } from "./types";

const testTimeout = 5 * 60 * 1000;

const transactionCheck =
  (currencyId: string) =>
  ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(
        parseCurrencyUnit(getCryptoCurrencyById(currencyId).units[0], "0.01")
      ),
      `${currencyId} balance is too low`
    );
  };

const evmBasicMutations = ({ maxAccount }) => [
  {
    name: "move 50%",
    maxRun: 2,
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
        transaction.gasPrice || 0
      );
      expect(operation.fee.toNumber()).toBeLessThanOrEqual(
        estimatedGas.toNumber()
      );
      expect(account.balance.toString()).toBe(
        accountBeforeTransaction.balance.minus(operation.value).toString()
      );
    },
  },
];

const cronos: AppSpec<Transaction> = {
  name: "Cronos",
  currency: getCryptoCurrencyById("cronos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
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
  },
  testTimeout,
  transactionCheck: transactionCheck("songbird"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
  genericDeviceAction: acceptTransaction,
};

const flare: AppSpec<Transaction> = {
  name: "Moonbeam",
  currency: getCryptoCurrencyById("flare"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
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
