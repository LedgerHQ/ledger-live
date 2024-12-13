import invariant from "invariant";
import expect from "expect";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { acceptTransaction } from "./bot-deviceActions";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { isAccountEmpty } from "@ledgerhq/coin-framework/account";
import { AccountLike } from "@ledgerhq/types-live";

const currency = getCryptoCurrencyById("aptos");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.0001");
const reserve = parseCurrencyUnit(currency.units[0], "0.5");

const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.5");
const maxAccountSiblings = 4;

const checkSendableToEmptyAccount = (amount: BigNumber, recipient: AccountLike) => {
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(amount.gt(minBalanceNewAccount), "not enough funds to send to new account");
  }
};

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

        const sibling = pickSiblings(siblings, maxAccountSiblings);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        const updates = [
          {
            amount,
          },
          {
            recipient,
          },
        ];

        return {
          transaction,
          updates,
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
      name: "send max",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");

        const sibling = pickSiblings(siblings, maxAccountSiblings);

        // Send the full spendable balance
        const amount = maxSpendable;

        checkSendableToEmptyAccount(amount, sibling);

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
        botTest("account spendable balance is very low", () =>
          expect(account.spendableBalance.lt(reserve)).toBe(true),
        );
      },
    },
  ],
};

export default { aptos };
