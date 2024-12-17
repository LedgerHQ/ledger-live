import invariant from "invariant";
import expect from "expect";
import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/devices";
import { isAccountEmpty } from "@ledgerhq/coin-framework/account";
import { AccountLike } from "@ledgerhq/types-live";
import type { AppSpec } from "../../bot/types";
import { getCryptoCurrencyById } from "../../currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { genericTestDestination, pickSiblings, botTest } from "../../bot/specs";
import { acceptTransaction } from "./speculos-deviceActions";
import type { Transaction } from "./types";

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
    model: DeviceModelId.nanoSP,
    appName: "Aptos",
  },
  genericDeviceAction: acceptTransaction,
  minViableAmount: minAmountCutoff,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
  },
  mutations: [
    {
      name: "Send ~50%",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");

        const sibling = pickSiblings(siblings, maxAccountSiblings);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        const transaction = bridge.createTransaction(account);

        const updates: Array<Partial<Transaction>> = [
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
      name: "Transfer Max",
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
