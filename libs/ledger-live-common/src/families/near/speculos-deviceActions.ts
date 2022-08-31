import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Confirm",
        button: "Rr",
      },
      {
        title: "Deposit",
        button: "Rr",
      },
      {
        title: "Amount",
        button: "Rr",
      },
      {
        title: "To",
        button: "Rr",
      },
      {
        title: "From",
        button: "Rr",
      },
      {
        title: "Args",
        button: "Rr",
      },
      {
        title: "Approve",
        button: "LRlr",
        final: true,
      },
    ],
  });
