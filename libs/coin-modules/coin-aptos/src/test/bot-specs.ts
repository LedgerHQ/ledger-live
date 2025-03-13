import invariant from "invariant";
import expect from "expect";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import type { Transaction } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genericTestDestination, pickSiblings, botTest } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
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
  testTimeout: 6 * 60 * 1000,
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
    // {
    //   name: "Send ~50% of stdAPT token",
    //   feature: "tokens",
    //   maxRun: 1,
    //   deviceAction: acceptTokenTransaction,
    //   testDestination: genericTestDestination,
    //   transaction: ({ account, siblings, bridge, maxSpendable }) => {
    //     invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
    //     const sibling = pickSiblings(siblings, maxAccount);
    //     const recipient = sibling.freshAddress;
    //     const amount = maxSpendable.div(2).integerValue();

    //     const transaction = bridge.createTransaction(account);
    //     const updates: Array<Partial<Transaction>> = [
    //       {
    //         recipient,
    //       },
    //       { amount },
    //     ];

    //     return {
    //       transaction,
    //       updates,
    //     };
    //   },

    //   test: ({ accountBeforeTransaction, operation, account }) => {
    //     botTest("account spendable balance decreased with operation", () =>
    //       expect(account.spendableBalance).toEqual(
    //         accountBeforeTransaction.spendableBalance.minus(operation.value),
    //       ),
    //     );
    //   },
    // },
  ],
};

export default {
  aptosSpecs,
};
