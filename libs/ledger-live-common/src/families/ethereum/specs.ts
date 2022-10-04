import expect from "expect";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import sample from "lodash/sample";
import type { Transaction } from "./types";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
  findCompoundToken,
} from "../../currencies";
import {
  makeCompoundSummaryForAccount,
  getAccountCapabilities,
} from "../../compound/logic";
import { getSupplyMax } from "./modules/compound";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { getGasLimit } from "./transaction";
import { DeviceModelId } from "@ledgerhq/devices";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CompoundAccountSummary } from "../../compound/types";
import { acceptTransaction } from "./speculos-deviceActions";

const testTimeout = 8 * 60 * 1000;

const ethereumBasicMutations = ({ maxAccount }) => [
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
      const estimatedGas = getGasLimit(transaction).times(
        transaction.gasPrice || 0
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
];

function findCompoundAccount(account, f: (...args: Array<any>) => any) {
  return sample(
    (account.subAccounts || []).filter((a) => {
      if (
        a.type === "TokenAccount" &&
        a.balance.gt(0) &&
        findCompoundToken(a.token)
      ) {
        const c = getAccountCapabilities(a);
        return c && f(c, a);
      }

      return false;
    })
  );
}

function getCompoundResult({ account, transaction, accountBeforeTransaction }) {
  const a = account.subAccounts?.find((a) => a.id === transaction.subAccountId);
  const aBefore = accountBeforeTransaction.subAccounts?.find(
    (a) => a.id === transaction.subAccountId
  );
  invariant(
    a && a.type === "TokenAccount",
    "account %s found",
    transaction.subAccountId
  );
  invariant(
    aBefore && aBefore.type === "TokenAccount",
    "account %s found",
    transaction.subAccountId
  );
  const capabilities = getAccountCapabilities(a);
  const summary = makeCompoundSummaryForAccount(a, account);
  const capabilitiesBefore = getAccountCapabilities(aBefore);
  const summaryBefore = makeCompoundSummaryForAccount(
    aBefore,
    accountBeforeTransaction
  );
  invariant(
    capabilities,
    "account %s have no capabilities found",
    transaction.subAccountId
  );
  return {
    a,
    capabilities,
    summary,
    previous: {
      summary: summaryBefore,
      capabilities: capabilitiesBefore,
    },
  };
}

const minAmountETH = parseCurrencyUnit(
  getCryptoCurrencyById("ethereum").units[0],
  "0.01"
);

const ethereum: AppSpec<Transaction> = {
  name: "Ethereum",
  currency: getCryptoCurrencyById("ethereum"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Ethereum",
    appVersion: "1.9.20-dev", // FIXME remove this line once 1.9.20 lands on coin-apps (branch ledger-live-bot)
  },
  genericDeviceAction: acceptTransaction,
  testTimeout,
  minViableAmount: minAmountETH,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountETH), "balance is too low");
  },
  // @ts-expect-error seriously we have to do somehting
  mutations: ethereumBasicMutations({
    maxAccount: 7,
  }).concat([
    {
      name: "allow MAX a compound token",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        // find an existing token which was not yet allowed
        const a = findCompoundAccount(account, (c) => c.enabledAmount.eq(0));
        invariant(a, "no compound account to allow");
        const ctoken = findCompoundToken(a.token);
        invariant(ctoken, "ctoken found");
        return {
          transaction: bridge.createTransaction(account) as Transaction,
          updates: [
            {
              mode: "erc20.approve",
              subAccountId: a.id,
              recipient: (ctoken as TokenCurrency).contractAddress,
            },
            {
              useAllAmount: true,
            },
          ] as Partial<Transaction>[],
        };
      },
      test: (arg) => {
        const { capabilities } = getCompoundResult(arg);
        botTest("enabledAmountIsUnlimited is true", () =>
          expect((capabilities as any).enabledAmountIsUnlimited).toBe(true)
        );
      },
    },
    {
      name: "supply some compound token",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const a = findCompoundAccount(account, (c) => c.canSupply);
        invariant(a, "no compound account to supply");
        const ctoken = findCompoundToken(a.token);
        invariant(ctoken, "ctoken found");
        const amount = getSupplyMax(a)
          .times(0.5 + 0.5 * Math.random())
          .integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "compound.supply",
              subAccountId: a.id,
              amount,
            },
          ],
        };
      },
      test: (arg) => {
        const { transaction } = arg;
        const { summary, previous } = getCompoundResult(arg);
        invariant(
          summary,
          "could not find compound summary for account %s",
          transaction.subAccountId
        );
        botTest("totalSupplied matches", () =>
          expect(
            (summary as CompoundAccountSummary).totalSupplied.gt(
              previous.summary?.totalSupplied || new BigNumber(0)
            )
          ).toBe(true)
        );
      },
    },
    {
      name: "withdraw some compound token",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const a = findCompoundAccount(
          account,
          (c, a) =>
            c.canWithdraw &&
            a.operations.length > 0 && // 7 days has passed since last operation
            Date.now() - a.operations[0].date > 7 * 24 * 60 * 60 * 1000
        );
        invariant(a, "no compound account to withdraw");
        const ctoken = findCompoundToken(a.token);
        invariant(ctoken, "ctoken found");
        const nonSpendableBalance = a.balance.minus(a.spendableBalance);
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "compound.withdraw",
              subAccountId: a.id,
            },
            Math.random() < 0.5
              ? {
                  useAllAmount: true,
                }
              : {
                  amount: nonSpendableBalance
                    .times(Math.random())
                    .integerValue(),
                },
          ],
        };
      },
      test: (arg) => {
        const { transaction } = arg;
        const { summary, previous } = getCompoundResult(arg);
        invariant(
          summary,
          "could not find compound summary for account %s",
          transaction.subAccountId
        );
        invariant(
          previous.summary,
          "could not find a previous compound summary for account %s",
          transaction.subAccountId
        );

        if (arg.transaction.useAllAmount) {
          botTest("totalSupplies matches (2)", () =>
            expect(
              (summary as CompoundAccountSummary).totalSupplied.eq(0)
            ).toBe(true)
          );
        } else {
          botTest("totalSupplies matches (3)", () =>
            expect(
              (summary as CompoundAccountSummary).totalSupplied.lt(
                (previous.summary as CompoundAccountSummary).totalSupplied ||
                  new BigNumber(0)
              )
            ).toBe(true)
          );
        }
      },
    },
    {
      name: "disallow a compound token",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        // find an existing token which was allowed
        // set it back to zero
        // ? IDEA: only do it if there is nothing to withdraw
        const a = findCompoundAccount(
          account,
          (c) => !c.enabledAmount.gt(0) && c.enabledAmountIsUnlimited
        );
        invariant(a, "no compound account to disallow");
        const ctoken = findCompoundToken(a.token);
        invariant(ctoken, "ctoken found");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "erc20.approve",
              subAccountId: a.id,
              recipient: (ctoken as TokenCurrency).contractAddress,
            },
            {
              amount: new BigNumber(0),
            },
          ],
        };
      },
      test: (arg) => {
        const { capabilities } = getCompoundResult(arg);
        botTest("enabledAmount is zero", () =>
          expect((capabilities as any).enabledAmount.eq(0)).toBe(true)
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
  ]),
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
    appVersion: "1.9.20-dev", // FIXME remove this line once 1.9.20 lands on coin-apps (branch ledger-live-bot)
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
      // @ts-expect-error rxjs stuff
      transaction: ({ account, siblings, bridge }) => {
        const bep20Account = sample(
          (account.subAccounts || []).filter((a) => a.balance.gt(0))
        );
        invariant(bep20Account, "no bep20 account");
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
      // @ts-expect-error rxjs stuff
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

export default {
  bsc,
  polygon,
  ethereum,
  ethereumClassic,
  ethereumGoerli,
};
