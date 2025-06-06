import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import type { Transaction } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genericTestDestination, pickSiblings, botTest } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES, MayBlockAccountError } from "../consts";
import { getRandomTransferID } from "../common-logic";

const MIN_SAFE = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES * 2);
const maxAccount = 6;

const casperSpecs: AppSpec<Transaction> = {
  name: "Casper",
  currency: getCryptoCurrencyById("casper"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Casper",
    appVersion: "3.0.7",
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

        if (Math.random() < 0.5) {
          updates.push({
            transferId: getRandomTransferID(),
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

        if (transaction.transferId) {
          botTest("operation transferId", () =>
            expect(operation.extra).toMatchObject({
              transferId: transaction.transferId,
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
            transferId: getRandomTransferID(),
          });
        }

        return {
          transaction: bridge.createTransaction(account),
          updates,
        };
      },
      expectStatusWarnings: _ => {
        return {
          amount: MayBlockAccountError,
        };
      },
      testDestination: genericTestDestination,
      test: ({ account, transaction, operation }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.spendableBalance.toString()).toBe("0"),
        );

        if (transaction.transferId) {
          botTest("operation transferId", () =>
            expect(operation.extra).toMatchObject({
              transferId: transaction.transferId,
            }),
          );
        }
      },
    },
  ],
};

export default {
  casperSpecs,
};
