import expect from "expect";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
const currency = getCryptoCurrencyById("stellar");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const reserve = parseCurrencyUnit(currency.units[0], "1");
const stellar: AppSpec<Transaction> = {
  name: "Stellar",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Stellar",
  },
  mutations: [
    {
      name: "move ~50%",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        let amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();

        if (!sibling.used && amount.lt(reserve)) {
          invariant(
            maxSpendable.gt(reserve.plus(minAmountCutoff)),
            "not enough funds to send to new account"
          );
          amount = reserve;
        }

        const updates: Array<Partial<Transaction>> = [
          {
            amount,
          },
          {
            recipient,
          },
        ];

        if (Math.random() < 0.5) {
          updates.push({
            memoType: "MEMO_TEXT",
            memoValue: "Ledger Live",
          });
        }

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation, transaction }) => {
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );

        if (transaction.memoValue) {
          expect(operation.extra).toEqual({
            memo: transaction.memoValue,
          });
        }
      },
    },
  ],
};
export default {
  stellar,
};
