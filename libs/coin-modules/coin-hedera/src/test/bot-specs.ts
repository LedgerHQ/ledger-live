import expect from "expect";
import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import type {
  AppSpec,
  TransactionTestInput,
  TransactionArg,
  TransactionRes,
} from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { isAccountEmpty } from "@ledgerhq/coin-framework/account";
import { acceptTransaction } from "./speculos-deviceActions";
import BigNumber from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";

const currency = getCryptoCurrencyById("hedera");
const memoTestMessage = "This is a test memo.";

// Ensure that, when the recipient corresponds to an empty account,
// the amount to send is greater or equal to the required minimum
// balance for such a recipient
const checkSendableToEmptyAccount = (amount: BigNumber, recipient: AccountLike) => {
  const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(amount.gt(minBalanceNewAccount), "not enough funds to send to new account");
  }
};

// NOTE: because we can't create Hedera accounts in Ledger Live,
// the bot will only use the 3 existing accounts that have been setup
const hedera: AppSpec<Transaction> = {
  name: "Hedera",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Hedera",
    // FIXME app v1.1.0 has a known issue, this should be removed when a stable version is released
    firmware: "2.1.0",
    appVersion: "1.0.8",
  },
  genericDeviceAction: acceptTransaction,
  currency,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(0), "Balance is too low");
  },
  allowEmptyAccounts: true,
  mutations: [
    {
      name: "Send ~50%",
      feature: "send",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const amount = account.balance.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        return {
          transaction,
          updates: [{ amount }, { recipient }],
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
        operation,
      }: TransactionTestInput<Transaction>): void => {
        botTest("account balance moved with operation value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString(),
          ),
        );
      },
    },
    {
      name: "Send max",
      feature: "sendMax",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("Account balance should have decreased", () => {
          expect(account.balance.toNumber()).toEqual(
            accountBeforeTransaction.balance.minus(operation.value).toNumber(),
          );
        });
      },
    },
    {
      name: "Memo",
      feature: "send",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const amount = account.balance.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        return {
          transaction,
          updates: [{ recipient }, { amount }, { memo: memoTestMessage }],
        };
      },
      test: ({ transaction }: TransactionTestInput<Transaction>): void => {
        botTest("transaction.memo is set", () => expect(transaction.memo).toBe(memoTestMessage));
      },
      testDestination: genericTestDestination,
    },
  ],
};

export default { hedera };
