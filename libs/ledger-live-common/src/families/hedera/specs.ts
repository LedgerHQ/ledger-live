import expect from "expect";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppSpec } from "../../bot/types";
import type { Transaction } from "./types";
import { pickSiblings } from "../../bot/specs";
import { isAccountEmpty } from "../../account";

const currency = getCryptoCurrencyById("hedera");

// Ensure that, when the recipient corresponds to an empty account,
// the amount to send is greater or equal to the required minimum
// balance for such a recipient
const checkSendableToEmptyAccount = (amount, recipient) => {
  const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(
      amount.gt(minBalanceNewAccount),
      "not enough funds to send to new account"
    );
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
  currency,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(0), "Balance is too low");
  },
  mutations: [
    {
      name: "Send ~50%",
      maxRun: 2,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;

        const transaction = bridge.createTransaction(account);

        const amount = account.balance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        return {
          transaction,
          updates: [{ amount }, { recipient }],
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
    {
      name: "Send max",
      maxRun: 2,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
      test: ({ accountBeforeTransaction, account, operation, transaction }) => {
        const accountBalanceAfterTx = account.balance.toNumber();

        // NOTE: operation.fee is the ACTUAL (not estimated) fee cost of the transaction
        const amount = accountBeforeTransaction.balance
          .minus(transaction.amount.plus(operation.fee))
          .toNumber();

        expect(accountBalanceAfterTx).toBe(amount);
      },
    },
  ],
};

export default { hedera };
