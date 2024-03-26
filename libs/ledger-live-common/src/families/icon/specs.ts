import type { Transaction } from "../../families/icon/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import { acceptTransaction } from "./speculos-deviceActions";
import { isAccountEmpty } from "../../account";
import { convertICXtoLoop } from "./logic";

const ICON_MIN_SAFE = new BigNumber(1);
const maxAccounts = 6;
const currency = getCryptoCurrencyById("icon");

const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");

// FIXME ICON have a bug where the amounts from the API have imprecisions
const expectedApproximate = (
  value: BigNumber,
  expected: BigNumber,
  delta = convertICXtoLoop(0.00000005),
) => {
  if (value.minus(expected).abs().gt(delta)) {
    expect(value.toString()).toEqual(value.toString());
  }
};

const checkSendableToEmptyAccount = (amount, recipient) => {
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(amount.gt(minBalanceNewAccount), "not enough funds to send to new account");
  }
};
const icon: AppSpec<Transaction> = {
  name: "Icon",
  currency: getCryptoCurrencyById("icon"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Icon",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  skipOperationHistory: true,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(ICON_MIN_SAFE), "balance is too low");
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
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance.div(2).integerValue();
        checkSendableToEmptyAccount(amount, sibling);
        if (!sibling.used && amount.lt(ICON_MIN_SAFE)) {
          invariant(
            account.spendableBalance.gt(ICON_MIN_SAFE),
            "send is too low to activate account",
          );
          amount = ICON_MIN_SAFE;
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
