// import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
// import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import type { Transaction } from "../types";

const currency = getCryptoCurrencyById("aptos");
// const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.0001");
const maxAccountSiblings = 4;

const aptos: AppSpec<Transaction> = {
  name: "Aptos",
  currency,
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "aptos",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 5 * 60 * 1000,
  // minViableAmount: minBalanceNewAccount,
  // transactionCheck: ({ maxSpendable }) => {
  //   invariant(maxSpendable.gt(minBalanceNewAccount), "balance is too low");
  // },
  mutations: [
    {
      name: "Send ~50%",
      feature: "send",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        const sibling = pickSiblings(siblings, maxAccountSiblings);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();

        const transaction = bridge.createTransaction(account);
        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
          },
          { amount },
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
    // {
    //   name: "Send max",
    //   maxRun: 2,
    //   testDestination: genericTestDestination,
    //   transaction: ({ account, siblings, bridge }) => {
    //     const sibling = pickSiblings(siblings, maxAccountSiblings);
    //     const recipient = sibling.freshAddress;

    //     const transaction = bridge.createTransaction(account);
    //     const updates: Array<Partial<Transaction>> = [
    //       {
    //         recipient,
    //       },
    //       { useAllAmount: true },
    //     ];

    //     return {
    //       transaction,
    //       updates,
    //     };
    //   },
    //   test: ({ account, accountBeforeTransaction, operation }) => {
    //     botTest("Account balance should have decreased", () => {
    //       expect(account.balance.toNumber()).toEqual(
    //         accountBeforeTransaction.balance.minus(operation.value).toNumber(),
    //       );
    //     });
    //   },
    // },
  ],
};

export default { aptos };
