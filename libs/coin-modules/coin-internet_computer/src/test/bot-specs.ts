import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import BigNumber from "bignumber.js";
import type { Transaction } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genericTestDestination, pickSiblings, botTest } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import { getRandomTransferID } from "../common-logic/utils";

const MIN_SAFE = new BigNumber(10);
const maxAccount = 6;

const internetComputerSpecs: AppSpec<Transaction> = {
  name: "InternetComputer",
  currency: getCryptoCurrencyById("internet_computer"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Internet Computer",
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

      test: ({ accountBeforeTransaction, operation, account, transaction }) => {
        botTest("account spendable balance decreased with operation", () =>
          expect(account.spendableBalance).toEqual(
            accountBeforeTransaction.spendableBalance.minus(operation.value),
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
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        const transaction = bridge.createTransaction(account);
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
          transaction,
          updates,
        };
      },
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
  internetComputerSpecs,
};
