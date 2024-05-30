import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec, TransactionDestinationTestInput } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import invariant from "invariant";
import { acceptTransaction } from "./speculos-deviceActions";
import { Transaction } from "./types";

const MIN_SAFE = new BigNumber(1.5e7); // approx two txs' fees (0.015 TON)

export const testDestination = <T>({
  destination,
  destinationBeforeTransaction,
  sendingOperation,
}: TransactionDestinationTestInput<T>): void => {
  const amount = sendingOperation.value.minus(sendingOperation.fee);
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
    model: DeviceModelId.nanoS,
    appName: "TON",
  },
  genericDeviceAction: acceptTransaction,
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
        ];
        if (Math.random() < 0.5) updates.push({ comment: { isEncrypted: false, text: "LL Bot" } });

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
        ];
        if (Math.random() < 0.5) updates.push({ comment: { isEncrypted: false, text: "LL Bot" } });

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
  ],
};

export default {
  tonSpecs,
};
