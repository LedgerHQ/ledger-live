import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
import { casperPubKeyToAccountHash, deployHashToString } from "./utils";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: "Rr",
      },
      {
        title: "Txn hash",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          if (transaction.deploy)
            return deployHashToString(transaction.deploy.hash);
          return "";
        },
      },
      {
        title: "Type",
        button: "Rr",
        expectedValue: () => "Token transfer",
      },
      {
        title: "Chain ID",
        button: "Rr",
        expectedValue: () => "casper",
      },
      {
        title: "Account",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          `${transaction.fees
            .toNumber()
            .toLocaleString("en-US")
            .replaceAll(",", " ")} motes`,
      },
      {
        title: "Target",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          casperPubKeyToAccountHash(transaction.recipient),
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ status }) =>
          `${status.amount
            .toNumber()
            .toLocaleString("en-US")
            .replaceAll(",", " ")} motes`,
      },
      {
        title: "APPROVE",
        button: "LRlr",
      },
    ],
  });
