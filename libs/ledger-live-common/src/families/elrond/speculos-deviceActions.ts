import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow } from "../../bot/specs";
import { formatCurrencyUnit } from "../../currencies";
export const acceptMoveBalanceTransaction: DeviceAction<Transaction, any> =
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
          formatCurrencyUnit(account.unit, transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          })
            .replace(/\s+/g, " ")
            .replace("egld", "EGLD"), // FIXME
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
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptEsdtTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Token",
        button: "Rr",
        expectedValue: () => "MEX",
      },
      {
        title: "Value",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(account.unit, transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Fee",
        button: "Rr",
        // TODO: add a expectedValue fn
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });
export default {
  acceptMoveBalanceTransaction,
  acceptEsdtTransferTransaction,
};
