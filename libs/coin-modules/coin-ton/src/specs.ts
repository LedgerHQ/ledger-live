import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec, TransactionDestinationTestInput } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import expect from "expect";
import invariant from "invariant";
import { generateDeviceActionFlow } from "./speculos-deviceActions";
import { Transaction } from "./types";
import { BotScenario } from "./utils";

const MIN_SAFE = new BigNumber(1.5e7); // approx two txs' fees (0.015 TON)

export const testDestination = <T>({
  destination,
  destinationBeforeTransaction,
  sendingOperation,
}: TransactionDestinationTestInput<T>): void => {
  const amount = sendingOperation.value;
  const inOp = destination.operations.find(
    op => op.hash === sendingOperation.hash && op.type === "IN",
  );
  const inFees = inOp?.fee ?? BigNumber(0);
  botTest("account balance increased with transaction amount", () =>
    expect(destination.balance.toString()).toBe(
      destinationBeforeTransaction.balance.plus(amount).minus(inFees).toString(),
    ),
  );
  botTest("operation amount is consistent with sendingOperation", () =>
    expect({
      type: inOp?.type,
      amount: inOp?.value?.toString(),
    }).toMatchObject({
      type: "IN",
      amount: amount.toString(),
    }),
  );
};

const tonSpecs: AppSpec<Transaction> = {
  name: "TON",
  currency: getCryptoCurrencyById("ton"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "TON",
  },
  genericDeviceAction: generateDeviceActionFlow(BotScenario.DEFAULT),
  testTimeout: 6 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send ~50%",
      maxRun: 1,
      testDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");

        const updates: Array<Partial<Transaction>> = [
          { recipient: pickSiblings(siblings).freshAddress },
          { amount: maxSpendable.div(2).integerValue() },
          { comment: { isEncrypted: false, text: "LL Bot" } },
        ];

        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },

      test: ({ accountBeforeTransaction, operation, account, transaction }) => {
        // we don't know the exact amount in fees, so we accept +- 20% of expected fees
        const baseAmount = accountBeforeTransaction.balance.minus(transaction.amount);
        const maxBalance = baseAmount.minus(transaction.fees.multipliedBy(0.8).integerValue());
        const minBalance = baseAmount.minus(transaction.fees.multipliedBy(1.2).integerValue());
        botTest("account spendable balance decreased with operation", () => {
          expect(account.spendableBalance.lte(maxBalance)).toBe(true);
          expect(account.spendableBalance.gte(minBalance)).toBe(true);
        });

        botTest("operation comment", () =>
          expect(operation.extra).toMatchObject({
            comment: transaction.comment,
          }),
        );
      },
    },
    {
      name: "Transfer Max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const updates: Array<Partial<Transaction>> = [
          { recipient: pickSiblings(siblings).freshAddress },
          { useAllAmount: true },
          { comment: { isEncrypted: false, text: "LL Bot" } },
        ];

        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },
      testDestination,
      test: ({ account, transaction, operation }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.spendableBalance.toFixed()).toBe("0"),
        );

        botTest("operation comment", () =>
          expect(operation.extra).toMatchObject({
            comment: transaction.comment,
          }),
        );
      },
    },
    {
      name: "Send ~50% jUSDT",
      maxRun: 1,
      deviceAction: generateDeviceActionFlow(BotScenario.TOKEN_TRANSFER),
      transaction: ({ account, bridge, maxSpendable, siblings }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const subAccount = account.subAccounts?.find(
          a => a.type === "TokenAccount" && a.spendableBalance.gt(0),
        );
        const recipient = (siblings[0] as Account).freshAddress;
        invariant(subAccount && subAccount.type === "TokenAccount", "no subAccount with jUSDT");
        const amount = subAccount.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const updates: Array<Partial<Transaction>> = [
          {
            subAccountId: subAccount.id,
          },
          {
            recipient,
          },
          {
            amount,
          },
        ];
        if (Math.random() < 0.5) updates.push({ comment: { isEncrypted: false, text: "LL Bot" } });
        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation, transaction, status }) => {
        const subAccountId = transaction.subAccountId;
        const subAccount = account.subAccounts?.find(sa => sa.id === subAccountId);
        const subAccountBeforeTransaction = accountBeforeTransaction.subAccounts?.find(
          sa => sa.id === subAccountId,
        );
        botTest("subAccount balance moved with the tx status amount", () =>
          expect(subAccount?.balance.toString()).toBe(
            subAccountBeforeTransaction?.balance.minus(status.amount).toString(),
          ),
        );
        botTest("operation comment", () =>
          expect(operation.extra).toMatchObject({
            comment: transaction.comment,
          }),
        );
      },
    },
  ],
};

export default {
  tonSpecs,
};
