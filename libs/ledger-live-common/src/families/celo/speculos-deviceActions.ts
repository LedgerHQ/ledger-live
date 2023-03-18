import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

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
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount, {
            forceFloating: true,
          }),
      },
      {
        title: "Address",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Max Fees",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "No Gateway Fee",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Validator",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Type",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          return typeWording[transaction.mode];
        },
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
      },
    ],
  });
