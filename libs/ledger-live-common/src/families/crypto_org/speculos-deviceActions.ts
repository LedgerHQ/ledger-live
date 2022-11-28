import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: "Rr",
      },
      {
        title: "Chain ID",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Account",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Sequence",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Type",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Amount",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "From",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Fee",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Gas",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "To",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Approve",
        button: "LRlr",
      },
    ],
  });
