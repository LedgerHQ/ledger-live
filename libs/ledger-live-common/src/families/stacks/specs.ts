import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";

import type { Transaction } from "./types";
import { getCryptoCurrencyById } from "../../currencies";
import { pickSiblings, botTest } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";

const MIN_SAFE = new BigNumber(10000);
const stacksSpecs: AppSpec<Transaction> = {
  disabled: false,
  name: "Stacks",
  currency: getCryptoCurrencyById("stacks"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Stacks",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 25 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send 50%~",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (!sibling.used && amount.lt(MIN_SAFE)) {
          invariant(
            account.spendableBalance.gt(MIN_SAFE),
            "send is too low to activate account"
          );
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
            accountBeforeTransaction.balance.minus(operation.value).toFixed()
          )
        );
      },
    },
    {
      name: "Transfer Max",
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
    },
  ],
};

export default {
  stacksSpecs,
};
