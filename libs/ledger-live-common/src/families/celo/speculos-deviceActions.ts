import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

const typeWording = {
  send: "Send",
  lock: "Lock",
  unlock: "Unlock",
  withdraw: "Withdraw",
  vote: "Vote",
  revoke: "Revoke",
  activate: "Activate",
  register: "Create Account",
};

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: "Rr",
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount, {
            forceFloating: true,
          }),
      },
      {
        title: "Address",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Max Fees",
        button: "Rr",
      },
      {
        title: "No Gateway Fee",
        button: "Rr",
      },
      {
        title: "Validator",
        button: "Rr",
      },
      {
        title: "Type",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          return typeWording[transaction.mode];
        },
      },
      {
        title: "Accept",
        button: "LRlr",
      },
    ],
  });
