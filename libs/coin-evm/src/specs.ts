/* istanbul ignore file: don't test the test. */

import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import BigNumber from "bignumber.js";
import {
  AppSpec,
  MutationSpec,
  TransactionDestinationTestInput,
  TransactionRes,
} from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
} from "@ledgerhq/coin-framework/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { acceptTransaction, avalancheSpeculosDeviceAction } from "./speculos-deviceActions";
import { Transaction as EvmTransaction } from "./types";
import { getEstimatedFees } from "./logic";

const testTimeout = 10 * 60 * 1000;

const minBalancePerCurrencyId: Partial<Record<CryptoCurrency["id"], number>> = {
  arbitrum: 0.001,
  arbitrum_goerli: 0.001,
  optimism: 0.001,
  optimism_goerli: 0.001,
  boba: 0.001,
  metis: 0.01,
  moonriver: 0.1,
  rsk: 0.05,
  polygon_zk_evm: 0.001,
  polygon_zk_evm_testnet: 0.001,
  base: 0.001,
  base_goerli: 0.001,
  avalanche_c_chain: 0.001,
  bsc: 0.005,
  polygon: 0.005,
  ethereum: 0.001,
  ethereum_goerli: 0.001,
  ethereum_sepolia: 0.001,
  ethereum_holesky: 0.001,
  ethereum_classic: 0.05,
  lukso: 0.01,
};

/**
 * Method in charge of verifying that both the recipient and sender of a *coin* transaction
 * have received/lost the expected amount and have now the right balances
 *
 * ⚠️ Some blockchains specific rules are included
 */
const testCoinDestination = (args: TransactionDestinationTestInput<EvmTransaction>): void => {
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
  ({ maxSpendable }: { maxSpendable: BigNumber }): void => {
    const currency = getCryptoCurrencyById(currencyId);

    const minBalance = parseCurrencyUnit(
      currency.units[0],
      `${minBalancePerCurrencyId[currency.id] || 1}`,
    );

    invariant(maxSpendable.gt(minBalance), `${currencyId} balance is too low`);
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
    transaction: ({ account, siblings, bridge, maxSpendable }): TransactionRes<EvmTransaction> => {
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
    }): void => {
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
    transaction: ({ account, siblings, bridge }): TransactionRes<EvmTransaction> => {
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
    }): void => {
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
];

const moveErc20Mutation: MutationSpec<EvmTransaction> = {
  name: "move some ERC20 like (ERC20, BEP20, etc...)",
  maxRun: 1,
  testDestination: testCoinDestination,
  transaction: ({ account, siblings, bridge }): TransactionRes<EvmTransaction> => {
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
  test: ({ accountBeforeTransaction, account, transaction }): void => {
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
};

const getAppQuery = (currencyId: CryptoCurrency["id"]): AppSpec<EvmTransaction>["appQuery"] => {
  switch (currencyId) {
    case "avalanche_c_chain":
      return { model: DeviceModelId.nanoS, appName: "Avalanche" };
    case "polygon":
      return { model: DeviceModelId.nanoS, appName: "Polygon" };
    case "bsc":
      return { model: DeviceModelId.nanoS, appName: "Binance Smart Chain" };
    case "ethereum_classic":
      return { model: DeviceModelId.nanoS, appName: "Ethereum Classic" };
    default:
      return {
        model: DeviceModelId.nanoS,
        appName: "Ethereum",
        appVersion: "1.10.3",
      };
  }
};

const getGenericDeviceAction = (
  currencyId: CryptoCurrency["id"],
): AppSpec<EvmTransaction>["genericDeviceAction"] => {
  if (currencyId === "avalanche_c_chain") {
    return avalancheSpeculosDeviceAction;
  }

  return acceptTransaction;
};

const getDependency = (currencyId: CryptoCurrency["id"]): AppSpec<EvmTransaction>["dependency"] => {
  switch (currencyId) {
    case "bsc":
    case "polygon":
    case "ethereum_classic":
      return "Ethereum";
    default:
      return undefined;
  }
};

const getMutations = (currencyId: CryptoCurrency["id"]): AppSpec<EvmTransaction>["mutations"] => {
  switch (currencyId) {
    case "avalanche_c_chain":
      return evmBasicMutations({ maxAccount: 8 });
    case "polygon":
    case "bsc":
      return evmBasicMutations({ maxAccount: 8 }).concat(moveErc20Mutation);
    case "ethereum_classic":
      return evmBasicMutations({ maxAccount: 4 });
    case "ethereum":
      return evmBasicMutations({ maxAccount: 7 }).concat(moveErc20Mutation);
    case "telos_evm":
    case "polygon_zk_evm":
    case "polygon_zk_evm_testnet":
      return evmBasicMutations({ maxAccount: 3 });
    default:
      return evmBasicMutations({ maxAccount: 4 }).concat(moveErc20Mutation);
  }
};

export default Object.values(cryptocurrenciesById)
  .filter(currency => currency.family === "evm")
  .reduce<Partial<Record<CryptoCurrency["id"], AppSpec<EvmTransaction>>>>((acc, currency) => {
    acc[currency.id] = {
      name: currency.name,
      currency,
      appQuery: getAppQuery(currency.id),
      dependency: getDependency(currency.id),
      testTimeout,
      transactionCheck: transactionCheck(currency.id),
      mutations: getMutations(currency.id),
      genericDeviceAction: getGenericDeviceAction(currency.id),
    };
    return acc;
  }, {});
