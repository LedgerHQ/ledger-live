import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.amount, {
            postfixCode: true,
          }),
      },
      {
        title: "Fee",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });
