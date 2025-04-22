import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";

import type { Transaction } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { acceptTokenTransfer, acceptTransaction } from "./bot-deviceActions";

const MIN_SAFE = new BigNumber(10000);

// Define account types enum if not already defined in bridge/utils
enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

const stacksSpecs: AppSpec<Transaction> = {
  name: "Stacks",
  currency: getCryptoCurrencyById("stacks"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Stacks",
  },
  genericDeviceAction: acceptTransaction,
  // FIXME Stacks operations can take much longer to be confirmed
  // Need an evolution of the bot to tolerate unconfirmed ops and just warn maybe instead of error
  testTimeout: 25 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send 50%~",
      feature: "send",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        let amount = account.spendableBalance.div(1.9 + 0.2 * Math.random()).integerValue();

        if (!sibling.used && amount.lt(MIN_SAFE)) {
          invariant(account.spendableBalance.gt(MIN_SAFE), "send is too low to activate account");
          amount = MIN_SAFE;
        }

        const transaction = bridge.createTransaction(account);
        const updates = [{ recipient }, { amount }];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("account balance decreased with operation value", () =>
          expect(account.balance.toFixed()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toFixed(),
          ),
        );
      },
    },
    {
      name: "Transfer Max",
      feature: "sendMax",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        const transaction = bridge.createTransaction(account);
        const updates = [{ recipient }, { useAllAmount: true }];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account }) => {
        botTest("account balance is 0", () => expect(account.balance.toFixed()).toBe("0"));
      },
    },
    {
      name: "Send ~50% Token",
      feature: "tokens",
      maxRun: 1,
      deviceAction: acceptTokenTransfer,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        invariant(maxSpendable.gt(0), "Spendable balance is too low");

        // Find a token subaccount with positive balance
        const subAccount = account.subAccounts?.find(
          a => a.type === AccountType.TokenAccount && a.spendableBalance.gt(0),
        );

        invariant(
          subAccount && subAccount.type === AccountType.TokenAccount,
          "no token subAccount found with positive balance",
        );

        // Calculate amount to send (around 50% of available balance)
        const amount = subAccount.balance.div(1.9 + 0.2 * Math.random()).integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              subAccountId: subAccount.id,
            },
            {
              recipient,
            },
            {
              amount,
            },
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, transaction, status }) => {
        const subAccountId = transaction.subAccountId;
        const subAccount = account.subAccounts?.find(sa => sa.id === subAccountId);
        const subAccountBeforeTransaction = accountBeforeTransaction.subAccounts?.find(
          sa => sa.id === subAccountId,
        );

        botTest("subAccount balance decreased with the tx amount", () =>
          expect(subAccount?.balance.toString()).toBe(
            subAccountBeforeTransaction?.balance.minus(status.amount).toString(),
          ),
        );
      },
    },
  ],
};

export default {
  stacksSpecs,
};
