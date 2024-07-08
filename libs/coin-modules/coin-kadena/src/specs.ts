import expect from "expect";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";
import { botTest, pickSiblings, genericTestDestination } from "@ledgerhq/coin-framework/bot/specs";
import { isAccountEmpty } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import {
    parseCurrencyUnit,
  } from "@ledgerhq/coin-framework/currencies/index";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";
import { fetchCoinDetailsForAccount } from "./api/network";

const currency = getCryptoCurrencyById("kadena");
const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "1");
 
const checkSendableToEmptyAccount = (amount: BigNumber, recipient: Account) => {
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(
      amount.gt(minBalanceNewAccount),
      "not enough funds to send to new account"
    );
  }
};
 
const kadena: AppSpec<Transaction> = {
  name: "Kadena",
  currency,
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "kadena",
    appVersion: "0.2.6",
  },
  testTimeout: 10 * 60 * 1000,
  genericDeviceAction: acceptTransaction,
  mutations: [
    {
      name: "move ~50%",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
 
        let transaction = bridge.createTransaction(account);

        let amount = maxSpendable
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        checkSendableToEmptyAccount(amount, sibling);
 
        const updates = [{ amount }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("account balance decreased with operation value", () => {
          const total = operation.value.plus(operation.fee)
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(total).toString()
          );
        }
        );
      },
    },
    {
      name: "send max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");

        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
 
        let transaction = bridge.createTransaction(account);

        let amount = maxSpendable

        checkSendableToEmptyAccount(amount, sibling);
 
        const updates = [{ amount }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account }) => {
        botTest("account balance should be null on chain ID 0", async () => {
          const balance = await fetchCoinDetailsForAccount(account.freshAddress, [
            "0",
          ]);
          expect(balance.toString()).toBe("0");
        }
        );
      },
    },
  ],
};
 
export default { kadena };