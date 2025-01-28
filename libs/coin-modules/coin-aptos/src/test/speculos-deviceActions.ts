import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import { State } from "@ledgerhq/coin-framework/bot/types";

const typeWording = {
  send: "Send",
};

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        return typeWording[transaction.mode as keyof typeof typeWording];
      },
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
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
  ],
});
