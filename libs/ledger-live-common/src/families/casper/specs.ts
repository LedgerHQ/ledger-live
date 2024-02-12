import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";

import type { Transaction } from "../../families/casper/types";
import { getCryptoCurrencyById } from "../../currencies";
import { genericTestDestination, pickSiblings, botTest } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES, MayBlockAccountError } from "./consts";
import { getRandomTransferID } from "./msc-utils";

const MIN_SAFE = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES);
const maxAccount = 6;

const casperSpecs: AppSpec<Transaction> = {
  name: "Casper",
  currency: getCryptoCurrencyById("casper"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Casper",
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
