import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("ripple");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const reserve = parseCurrencyUnit(currency.units[0], "20");

const ripple: AppSpec<Transaction> = {
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
      test: ({ account, transaction, accountBeforeTransaction, operation }) => {
        if (transaction.tag) {
          botTest("operation tag matches (in extra)", () =>
            expect(operation.extra).toMatchObject({
              tag: transaction.tag,
            }),
          );
        }

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
  ripple,
};
