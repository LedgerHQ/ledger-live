import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Confirm (1/2)",
        button: "Rr",
      },
      {
        title: "Confirm (2/2)",
        button: "Rr",
      },
      {
        title: "Input",
        button: "Rr",
      },
      {
        title: "Source (1/3)",
        button: "Rr",
      },
      {
        title: "Source (2/3)",
        button: "Rr",
      },
      {
        title: "Source (3/3)",
        button: "Rr",
      },
      {
        title: "Amount",
        button: "Rr",
      },
      {
        title: "Fee",
        button: "Rr",
      },
      {
        title: "Destination (1/3)",
        button: "Rr",
      },
      {
        title: "Destination (2/3)",
        button: "Rr",
      },
      {
        title: "Destination (3/3)",
        button: "Rr",
      },
      {
        title: "Reject",
        button: "Rr",
      },
      {
        title: "Accept",
        button: "LRlr",
      },
    ],
  });
