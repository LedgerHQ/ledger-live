import { genericTestDestination, pickSiblings, botTest } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec, TransactionTestInput } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "../types";
import { acceptTokenTransaction, acceptTransaction } from "./speculos-deviceActions";

const MIN_SAFE = new BigNumber(0.0001);
const maxAccount = 6;

const aptosSpecs: AppSpec<Transaction> = {
  name: "Aptos",
  currency: getCryptoCurrencyById("aptos"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Aptos",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send ~50%",
      feature: "send",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();

        const transaction = bridge.createTransaction(account);
        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
          },
          { amount },
        ];

        return {
          transaction,
          updates,
        };
      },

      test: ({ accountBeforeTransaction, operation, account }) => {
        botTest("account spendable balance decreased with operation", () =>
          expect(account.spendableBalance).toEqual(
            accountBeforeTransaction.spendableBalance.minus(operation.value),
          ),
        );
      },
    },
    {
      name: "Transfer Max",
      feature: "sendMax",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const updates: Array<Partial<Transaction>> = [
          {
            recipient: pickSiblings(siblings, maxAccount).freshAddress,
          },
          {
            useAllAmount: true,
          },
        ];

        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },
      testDestination: genericTestDestination,
      test: ({ account }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.spendableBalance.toString()).toBe("0"),
        );
      },
    },
    {
      name: "Send ~50% of token amount",
      feature: "tokens",
      maxRun: 1,
      deviceAction: acceptTokenTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(MIN_SAFE), "Balance is too low");

        const senderTokenAcc = findTokenSubAccountWithBalance(account);
        invariant(senderTokenAcc, "Sender token account with available balance not found");

        const sibling = pickSiblings(siblings, maxAccount);

        const recipientTokenAcc = findTokenSubAccountWithBalance(sibling);
        invariant(recipientTokenAcc, "Receiver token account with available balance not found");

        const amount = senderTokenAcc.spendableBalance.div(2).integerValue();
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      test: input => {
        expectTokenAccountCorrectBalanceChange(input);
      },
    },
  ],
};

function findTokenSubAccountWithBalance(account: Account) {
  return account.subAccounts?.find(acc => acc.type === "TokenAccount" && acc.balance.gt(0)) as
    | TokenAccount
    | undefined;
}

function expectTokenAccountCorrectBalanceChange({
  account,
  accountBeforeTransaction,
  status,
  transaction,
}: TransactionTestInput<Transaction>) {
  const tokenAccId = transaction.subAccountId;
  if (!tokenAccId) throw new Error("Wrong subAccountId");

  const tokenAccAfterTx = account.subAccounts?.find(acc => acc.id === tokenAccId);
  const tokenAccBeforeTx = accountBeforeTransaction.subAccounts?.find(acc => acc.id === tokenAccId);

  if (!tokenAccAfterTx || !tokenAccBeforeTx) {
    throw new Error("Token sub accounts not found!");
  }

  botTest("Token balance decreased with operation", () =>
    expect(tokenAccAfterTx.balance.toString()).toBe(
      tokenAccBeforeTx.balance.minus(status.amount).toString(),
    ),
  );
}

export default {
  aptosSpecs,
};
