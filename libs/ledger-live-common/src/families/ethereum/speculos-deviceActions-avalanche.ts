import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

export const avalancheSpeculosDeviceAction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Type",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          if (transaction.mode === "erc20.approve") return "Approve";
          return "";
        },
      },
      {
        title: "Transfer",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction, status }) => {
          const amount = transaction.useAllAmount
            ? status.amount
            : transaction.amount;

          return formatDeviceAmount(account.currency, amount);
        },
      },
      {
        title: "Contract",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Network",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Fee(GWEI)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "To",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
      },
      {
        title: "APPROVE",
        button: SpeculosButton.BOTH,
      },
    ],
  });
