import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

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

const arbitrum: AppSpec<Transaction> = {
  name: "Arbitrum",
  currency: getCryptoCurrencyById("arbitrum"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
  },
  testTimeout,
  transactionCheck: transactionCheck("arbitrum"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
};

const avalanche: AppSpec<Transaction> = {
  name: "Avalanche",
  currency: getCryptoCurrencyById("avalanche"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
  },
  testTimeout,
  transactionCheck: transactionCheck("avalanche"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
};

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
};

const evmos: AppSpec<Transaction> = {
  name: "Evmos",
  currency: getCryptoCurrencyById("evmos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
  },
  testTimeout,
  transactionCheck: transactionCheck("evmos"),
  mutations: evmBasicMutations({
    maxAccount: 3,
  }),
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
};

export default {
  arbitrum,
  avalanche,
  cronos,
  evmos,
  fantom,
  moonbeam,
};
