/* istanbul ignore file: don't test the test. */

import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import BigNumber from "bignumber.js";
import {
  AppSpec,
  MutationSpec,
  TransactionDestinationTestInput,
} from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
} from "@ledgerhq/coin-framework/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { acceptTransaction } from "./speculos-deviceActions";
import { Transaction as EvmTransaction } from "./types";
import { getEstimatedFees } from "./logic";

const testTimeout = 10 * 60 * 1000;

const ETH_UNIT = { code: "ETH", name: "ETH", magnitude: 18 };
const MBTC_UNIT = { name: "mBTC", code: "mBTC", magnitude: 5 };

const minBalancePerCurrencyId: Partial<Record<CryptoCurrency["id"], BigNumber>> = {
  arbitrum: parseCurrencyUnit(ETH_UNIT, "0.001"),
  arbitrum_goerli: parseCurrencyUnit(ETH_UNIT, "0.001"),
  optimism: parseCurrencyUnit(ETH_UNIT, "0.001"),
  optimism_goerli: parseCurrencyUnit(ETH_UNIT, "0.001"),
  boba: parseCurrencyUnit(ETH_UNIT, "0.001"),
  metis: parseCurrencyUnit(ETH_UNIT, "0.01"),
  moonriver: parseCurrencyUnit(ETH_UNIT, "0.1"),
  rsk: parseCurrencyUnit(MBTC_UNIT, "0.05"),
  polygon_zk_evm: parseCurrencyUnit(ETH_UNIT, "0.001"),
  polygon_zk_evm_testnet: parseCurrencyUnit(ETH_UNIT, "0.001"),
  base: parseCurrencyUnit(ETH_UNIT, "0.001"),
  base_goerli: parseCurrencyUnit(ETH_UNIT, "0.001"),
};

/**
 * Method in charge of verifying that both the recipient and sender of a *coin* transaction
 * have received/lost the expected amount and have now the right balances
 *
 * ⚠️ Some blockchains specific rules are included
 */
const testCoinDestination = (args: TransactionDestinationTestInput<EvmTransaction>) => {
  const { sendingAccount } = args;
  const { currency } = sendingAccount;

  // Because Arbitrum is an L2, gas is used in a specific way to ensure both the L2 and the L1 are getting paid.
  // But as of right now the `arbiscan.io` API is only returning the proposed gas price of
  // the transaction and not the effectively used gas price, which might differ.
  // This leads to not being able to correctly cost an operation and
  // therefore makes it impossible infer the sender's balance
  if (["arbitrum", "arbitrum_goerli"].includes(currency.id)) {
    return;
  }

  return genericTestDestination(args);
};

/**
 * Method in charge of verifying the balance of a coin account after
 * the transaction has been confirmed
 *
 * ⚠️ Some blockchains specific rules are included
 */
const testCoinBalance: MutationSpec<EvmTransaction>["test"] = ({
  account,
  accountBeforeTransaction,
  operation,
}) => {
  // Optimism works in a way where a transaction as a L2 cost and a L1 settlement cost
  // The explorer API is not capable of returning the L1 cost, therefore
  // the operation value will always be less than what
  // has been removed from the account balance
  //
  // Remark is also true for Abritrum but because of the arbiscan API not returning the
  // effectively used gas but the "bid"/proposition of gas of the transaction
  // resulting in inconsistencies regarding the cumulated value of a tx.
  // value + gasLimit * gasPrice <-- gasPrice can be wrong here.
  //
  // Klaytn is not providing the right gasPrice either at the moment
  // and their explorers are using the transaction gasPrice
  // instead of the effectiveGasPrice from the receipt
  const underValuedFeesCurrencies = ["optimism", "optimism_goerli", "base", "base_goerli"];
  const overValuedFeesCurrencies = ["arbitrum", "arbitrum_goerli", "klaytn"];
  const currenciesWithFlakyBehaviour = [...underValuedFeesCurrencies, ...overValuedFeesCurrencies];

  // Classic test verifying exactly the balance
  if (!currenciesWithFlakyBehaviour.includes(account.currency.id)) {
    botTest("account balance moved with operation value", () =>
      expect(account.balance.toString()).toBe(
        accountBeforeTransaction.balance.minus(operation.value).toString(),
      ),
    );
  } else {
    // fallback test verifying the balance moved between the maximum and minimum possible values of the operation
    botTest(
      "account balance moved at least operation value and less than operation value plus fees",
      () => {
        // If the fee is undervalued like it is for optimism for example
        // the only doable check is to verify that the account
        // has lost *at least* the operation value + fee
        if (underValuedFeesCurrencies.includes(account.currency.id)) {
          const maxBalance = accountBeforeTransaction.balance.minus(
            operation.value.minus(operation.fee), // type OUT operations value includes fees so we remove it
          );

          expect({
            lessThanMaxBalance: account.balance.lte(maxBalance),
          }).toEqual({
            lessThanMaxBalance: true,
          });
        }

        // If the fee is overvalue like it is for arbitrum for example
        // we make sure the account has now a balance between
        // previous balance minus only operation value &
        // previous balance minus operation value + fee
        if (overValuedFeesCurrencies.includes(account.currency.id)) {
          const minBalance = accountBeforeTransaction.balance.minus(
            operation.value, // type OUT operations value includes fees
          );
          const maxBalance = accountBeforeTransaction.balance.minus(
            operation.value.minus(operation.fee),
          );

          expect({
            greaterThanMinBalance: account.balance.gte(minBalance),
            lessThanMaxBalance: account.balance.lte(maxBalance),
          }).toEqual({
            greaterThanMinBalance: true,
            lessThanMaxBalance: true,
          });
        }
      },
    );
  }
};

const transactionCheck =
  (currencyId: string) =>
  ({ maxSpendable }: { maxSpendable: BigNumber }) => {
    const currency = getCryptoCurrencyById(currencyId);
    invariant(
      maxSpendable.gt(
        minBalancePerCurrencyId[currency.id] || parseCurrencyUnit(currency.units[0], "1"),
      ),
      `${currencyId} balance is too low`,
    );
  };

const evmBasicMutations: ({
  maxAccount,
}: {
  maxAccount: number;
}) => MutationSpec<EvmTransaction>[] = ({ maxAccount }) => [
  {
    name: "move 50%",
    maxRun: 2,
    testDestination: testCoinDestination,
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
    test: ({
      account,
      accountBeforeTransaction,
      operation,
      transaction,
      status,
      optimisticOperation,
    }) => {
      const estimatedGas = getEstimatedFees(transaction);
      botTest("operation fee is not exceeding estimated gas", () =>
        expect(operation.fee.toNumber()).toBeLessThanOrEqual(estimatedGas.toNumber()),
      );

      testCoinBalance({
        account,
        accountBeforeTransaction,
        operation,
        transaction,
        status,
        optimisticOperation,
      });
    },
  },
  {
    name: "send max",
    maxRun: 1,
    testDestination: testCoinDestination,
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
    test: ({
      account,
      accountBeforeTransaction,
      operation,
      transaction,
      status,
      optimisticOperation,
    }) => {
      const estimatedGas = getEstimatedFees(transaction);
      botTest("operation fee is not exceeding estimated gas", () =>
        expect(operation.fee.toNumber()).toBeLessThanOrEqual(estimatedGas.toNumber()),
      );

      testCoinBalance({
        account,
        accountBeforeTransaction,
        operation,
        transaction,
        status,
        optimisticOperation,
      });
    },
  },
  {
    name: "move some ERC20",
    maxRun: 1,
    transaction: ({ account, siblings, bridge }) => {
      const erc20Account = sample((account.subAccounts || []).filter(a => a.balance.gt(0)));
      invariant(erc20Account, "no erc20 account");
      const sibling = pickSiblings(siblings, 3);
      const recipient = sibling.freshAddress;
      return {
        transaction: bridge.createTransaction(account),
        updates: [
          {
            recipient,
            subAccountId: erc20Account!.id,
          },
          Math.random() < 0.5
            ? {
                useAllAmount: true,
              }
            : {
                amount: erc20Account!.balance.times(Math.random()).integerValue(),
              },
        ],
      };
    },
    test: ({ accountBeforeTransaction, account, transaction }) => {
      invariant(accountBeforeTransaction.subAccounts, "sub accounts before");
      const erc20accountBefore = accountBeforeTransaction.subAccounts?.find(
        s => s.id === transaction.subAccountId,
      );
      invariant(erc20accountBefore, "erc20 acc was here before");
      invariant(account.subAccounts, "sub accounts");
      const erc20account = account.subAccounts!.find(s => s.id === transaction.subAccountId);
      invariant(erc20account, "erc20 acc is still here");

      if (transaction.useAllAmount) {
        botTest("erc20 account is empty", () => expect(erc20account!.balance.toString()).toBe("0"));
      } else {
        botTest("account balance moved with tx amount", () =>
          expect(erc20account!.balance.toString()).toBe(
            erc20accountBefore!.balance.minus(transaction.amount).toString(),
          ),
        );
      }
    },
  },
];

export default Object.values(cryptocurrenciesById)
  .filter(currency => currency.family === "evm")
  .reduce<Partial<Record<CryptoCurrency["id"], AppSpec<EvmTransaction>>>>((acc, currency) => {
    acc[currency.id] = {
      name: currency.name,
      currency,
      appQuery: {
        model: DeviceModelId.nanoS,
        appName: "Ethereum",
        appVersion: "1.10.3",
      },
      testTimeout,
      transactionCheck: transactionCheck(currency.id),
      mutations: evmBasicMutations({
        maxAccount: 3,
      }),
      genericDeviceAction: acceptTransaction,
    };
    return acc;
  }, {});
