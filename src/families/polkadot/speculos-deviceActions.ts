import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
import { formatCurrencyUnit } from "../../currencies";
const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Staking",
      button: "Rr",
    },
    {
      title: "Balances",
      button: "Rr",
    },
    {
      title: "Dest",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, transaction }) => {
        const formattedValue =
          "DOT " +
          formatCurrencyUnit(account.unit, transaction.amount, {
            disableRounding: true,
          });

        if (!formattedValue.includes(".")) {
          // if the value is pure integer, in the app it will automatically add an .0
          return formattedValue + ".0";
        }

        return formattedValue;
      },
    },
    {
      title: "Chain",
      button: "Rr",
      expectedValue: () => "Polkadot",
    },
    {
      title: "Nonce",
      button: "Rr",
      expectedValue: ({ account }) =>
        (account.polkadotResources?.nonce || 0).toString(),
    },
    {
      title: "Tip",
      button: "Rr",
    },
    {
      title: "Controller",
      button: "Rr",
    },
    {
      title: "Payee",
      button: "Rr",
    },
    {
      title: "Max additional",
      button: "Rr",
    },
    {
      title: "Targets",
      button: "Rr",
    },
    {
      title: "Era Phase",
      button: "Rr",
    },
    {
      title: "Era Period",
      button: "Rr",
    },
    {
      title: "Block",
      button: "Rr",
    },
    {
      title: "APPROVE",
      button: "LRlr",
    },
  ],
});
export default {
  acceptTransaction,
};
