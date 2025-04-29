import invariant from "invariant";
import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { toOperationRaw } from "@ledgerhq/coin-framework/serialization/index";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import { acceptTransaction } from "./speculos-deviceActions";
import {
  EXISTENTIAL_DEPOSIT,
  EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN,
  convertICXtoLoop,
} from "./logic";
import { Transaction } from "./types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const maxAccounts = 6;
const currency = getCryptoCurrencyById("icon");

// FIX ME ICON have a bug where the amounts from the API have imprecisions
const expectedApproximate = (
  value: BigNumber,
  expected: BigNumber,
  delta = convertICXtoLoop(0.000005),
) => {
  if (value.minus(expected).abs().gt(delta)) {
    expect(value.toString()).toEqual(value.toString());
  }
};

const icon: AppSpec<Transaction> = {
  name: "Icon",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Icon",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN.multipliedBy(2)),
      "balance is too low",
    );
  },
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Record<string, any> = toOperationRaw({
      ...optimisticOperation,
    });
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    delete opExpected.transactionSequenceNumber;
    botTest("optimistic operation matches", () =>
      expect(toOperationRaw(operation)).toMatchObject(opExpected),
    );
  },
  mutations: [
    {
      name: "send 50%~",
      feature: "send",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance.div(2).integerValue();

        if (!sibling.used && amount.lt(EXISTENTIAL_DEPOSIT)) {
          invariant(
            account.spendableBalance.gt(EXISTENTIAL_DEPOSIT),
            "send is too low to activate account",
          );
          amount = EXISTENTIAL_DEPOSIT;
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              amount,
            },
          ],
        };
      },
      test: ({ accountBeforeTransaction, operation, account }) => {
        botTest("account spendable balance decreased with operation", () =>
          expectedApproximate(
            account.spendableBalance,
            accountBeforeTransaction.spendableBalance.minus(operation.value),
          ),
        );
      },
    },
    {
      name: "send max",
      feature: "sendMax",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: ({ account }) => {
        botTest("account spendable balance is zero", () =>
          expectedApproximate(account.spendableBalance, new BigNumber(0)),
        );
      },
    },
  ],
};

export default {
  icon,
};
