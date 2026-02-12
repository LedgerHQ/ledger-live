import { genericTestDestination, botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec, TransactionTestInput } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import invariant from "invariant";

import type { MinaOperation, Transaction } from "../types/common";
import { acceptTransaction } from "./bot-deviceActions";
import { getRandomTransferID } from "./testUtils";

const maxAccount = 6;
// 0.1 MINA
const MIN_SAFE = new BigNumber(1 * 10 ** 8);

const minaSpecs: AppSpec<Transaction> = {
  name: "Mina",
  currency: getCryptoCurrencyById("mina"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Mina",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 15 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send ~50% to another account",
      maxRun: 1,
      testDestination: genericTestDestination,
      feature: "send",
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

        if (Math.random() < 0.5) {
          updates.push({
            memo: getRandomTransferID(),
          });
        }

        return {
          transaction,
          updates,
        };
      },

      test: ({
        accountBeforeTransaction,
        operation,
        account,
        transaction,
      }: TransactionTestInput<Transaction>) => {
        botTest("account spendable balance decreased with operation", () =>
          expect(account.spendableBalance).toEqual(
            accountBeforeTransaction.spendableBalance
              .minus(operation.value)
              .minus((operation.extra as MinaOperation["extra"]).accountCreationFee),
          ),
        );

        if (transaction.memo) {
          botTest("operation memo", () =>
            expect(operation.extra).toMatchObject({
              memo: transaction.memo,
            }),
          );
        }
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

        if (Math.random() < 0.5) {
          updates.push({
            memo: getRandomTransferID(),
          });
        }

        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },
      testDestination: genericTestDestination,
      test: ({ account, transaction, operation }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.spendableBalance.toString()).toBe("0"),
        );

        if (transaction.memo) {
          botTest("operation memo", () =>
            expect(operation.extra).toMatchObject({
              memo: transaction.memo,
            }),
          );
        }
      },
    },
  ],
};

export default {
  minaSpecs,
};
