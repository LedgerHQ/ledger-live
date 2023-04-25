import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec, MutationSpec } from "../../bot/types";
import { EIP1559ShouldBeUsed, getGasLimit } from "./transaction";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";
import { avalancheSpeculosDeviceAction } from "./speculos-deviceActions-avalanche";

const testTimeout = 8 * 60 * 1000;

const testBasicMutation = ({
  account,
  accountBeforeTransaction,
  operation,
  transaction,
}) => {
  // workaround for buggy explorer behavior (nodes desync)
  invariant(
    Date.now() - operation.date > 60000,
    "operation time to be older than 60s"
  );
  const gasPrice = EIP1559ShouldBeUsed(account.currency)
    ? transaction.maxFeePerGas
    : transaction.gasPrice;
  const estimatedGas = getGasLimit(transaction).times(gasPrice);
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
};

const ethereumBasicMutations = ({
  maxAccount,
}): MutationSpec<Transaction>[] => [
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
    test: testBasicMutation,
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
    test: testBasicMutation,
  },
];

const minAmountETH = parseCurrencyUnit(
  getCryptoCurrencyById("ethereum").units[0],
  "0.01"
);

const erc20mutation: MutationSpec<Transaction> = {
  name: "move some ERC20",
  maxRun: 1,
  transaction: ({ account, siblings, bridge }) => {
    const erc20Account = sample(
      (account.subAccounts || []).filter((a) => a.balance.gt(0))
    );
    if (!erc20Account) throw new Error("no erc20 account");
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
              amount: erc20Account.balance.times(Math.random()).integerValue(),
            },
      ],
    };
  },
  test: ({ accountBeforeTransaction, account, transaction, operation }) => {
    // workaround for buggy explorer behavior (nodes desync)
    invariant(
      Date.now() - Number(operation.date) > 60000,
      "operation time to be older than 60s"
    );
    invariant(accountBeforeTransaction.subAccounts, "sub accounts before");
    const erc20accountBefore = accountBeforeTransaction.subAccounts?.find(
      (s) => s.id === transaction.subAccountId
    );
    if (!erc20accountBefore) throw new Error("no erc20 account before");
    invariant(account.subAccounts, "sub accounts");
    const erc20account = account.subAccounts?.find(
      (s) => s.id === transaction.subAccountId
    );
    if (!erc20account) throw new Error("no erc20 account");

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
};

const ethereum: AppSpec<Transaction> = {
  name: "Ethereum",
  currency: getCryptoCurrencyById("ethereum"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout,
  minViableAmount: minAmountETH,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountETH), "balance is too low");
  },
  mutations: ethereumBasicMutations({
    maxAccount: 7,
  }).concat([erc20mutation]),
};

const minAmountETC = parseCurrencyUnit(
  getCryptoCurrencyById("ethereum_classic").units[0],
  "0.05"
);
const ethereumClassic: AppSpec<Transaction> = {
  name: "Ethereum Classic",
  currency: getCryptoCurrencyById("ethereum_classic"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum Classic",
  },
  genericDeviceAction: acceptTransaction,
  dependency: "Ethereum",
  testTimeout,
  minViableAmount: minAmountETC,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountETC), "balance is too low");
  },
  mutations: ethereumBasicMutations({
    maxAccount: 4,
  }),
};
const ethereumGoerli: AppSpec<Transaction> = {
  name: "Ethereum Goerli",
  currency: getCryptoCurrencyById("ethereum_goerli"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.10.1",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout,
  minViableAmount: minAmountETH,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountETH), "balance is too low");
  },
  mutations: ethereumBasicMutations({
    maxAccount: 8,
  }),
};

const minAmountBSC = parseCurrencyUnit(
  getCryptoCurrencyById("bsc").units[0],
  "0.005"
);
const bsc: AppSpec<Transaction> = {
  name: "BSC",
  currency: getCryptoCurrencyById("bsc"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Binance Smart Chain",
  },
  genericDeviceAction: acceptTransaction,
  dependency: "Ethereum",
  testTimeout,
  minViableAmount: minAmountBSC,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountBSC), "balance is too low");
  },
  mutations: ethereumBasicMutations({ maxAccount: 8 }).concat([
    {
      name: "move some BEP20",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const bep20Account = sample(
          (account.subAccounts || []).filter((a) => a.balance.gt(0))
        );
        if (!bep20Account) throw new Error("no bep20 account");
        const sibling = pickSiblings(siblings, 3);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { recipient, subAccountId: bep20Account.id },
            Math.random() < 0.5
              ? { useAllAmount: true }
              : {
                  amount: bep20Account.balance
                    .times(Math.random())
                    .integerValue(),
                },
          ],
        };
      },
    },
  ]),
};

const minAmountPolygon = parseCurrencyUnit(
  getCryptoCurrencyById("polygon").units[0],
  "0.005"
);

const polygon: AppSpec<Transaction> = {
  name: "Polygon",
  currency: getCryptoCurrencyById("polygon"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Polygon",
  },
  genericDeviceAction: acceptTransaction,
  dependency: "Ethereum",
  testTimeout,
  minViableAmount: minAmountPolygon,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountPolygon), "balance is too low");
  },
  mutations: ethereumBasicMutations({ maxAccount: 8 }).concat([
    {
      name: "move some ERC20",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const erc20Account = sample(
          (account.subAccounts || []).filter((a) => a.balance.gt(0))
        );
        if (!erc20Account) throw new Error("no erc20 account");
        const sibling = pickSiblings(siblings, 3);
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
    },
  ]),
};

const avax_c_chain = getCryptoCurrencyById("avalanche_c_chain");
const minAmountAVAXC = parseCurrencyUnit(avax_c_chain.units[0], "0.001");

const avalanche_c_chain: AppSpec<Transaction> = {
  name: "Avalanche C-Chain",
  currency: avax_c_chain,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Avalanche",
  },
  genericDeviceAction: avalancheSpeculosDeviceAction,
  testTimeout,
  minViableAmount: minAmountAVAXC,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountAVAXC), "balance is too low");
  },
  mutations: ethereumBasicMutations({ maxAccount: 8 }),
};

export default {
  avalanche_c_chain,
  bsc,
  polygon,
  ethereum,
  ethereumClassic,
  ethereumGoerli,
};
