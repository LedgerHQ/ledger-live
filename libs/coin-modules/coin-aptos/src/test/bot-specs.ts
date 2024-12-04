import invariant from "invariant";
import expect from "expect";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { acceptTransaction } from "./bot-deviceActions";
import type { Transaction } from "../types";
import BigNumber from "bignumber.js";

const currency = getCryptoCurrencyById("aptos");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.5");
const reserve = parseCurrencyUnit(currency.units[0], "1");
const maxAccount = 1;

const aptos: AppSpec<Transaction> = {
  name: "Aptos",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Aptos",
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
    {
      name: "send max to another account",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: ({ account }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.balance.toString()).toBe(new BigNumber(0).toString()),
        );
      },
    },
  ],
};
export default {
  aptos,
};
