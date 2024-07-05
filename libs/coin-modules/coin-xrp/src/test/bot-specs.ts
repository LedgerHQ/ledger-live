import invariant from "invariant";
import expect from "expect";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { acceptTransaction } from "./bot-deviceActions";
import type { Transaction } from "../types";

const currency = getCryptoCurrencyById("ripple");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const reserve = parseCurrencyUnit(currency.units[0], "20");

const xrp: AppSpec<Transaction> = {
  name: "XRP",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "XRP",
  },
  genericDeviceAction: acceptTransaction,
  minViableAmount: minAmountCutoff,
  mutations: [
    {
      name: "move ~50%",
      maxRun: 2,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 3);
        const recipient = sibling.freshAddress;
        let amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();

        if (!sibling.used && amount.lt(reserve)) {
          invariant(
            maxSpendable.gt(reserve.plus(minAmountCutoff)),
            "not enough funds to send to new account",
          );
          amount = reserve;
        }

        return {
          transaction,
          updates: [
            {
              amount,
            },
            {
              recipient,
            },
            Math.random() > 0.5
              ? {
                  tag: 123,
                }
              : null,
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("account balance moved with operation.value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString(),
          ),
        );
      },
    },
  ],
};
export default {
  xrp,
};
