import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "From",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Nonce",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.nonce.toString(),
      },
      {
        title: "Value",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount, {
            hideCode: true,
            showAllDigits: true,
          }),
      },
      {
        title: "Gas Limit",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.gasLimit.toFixed(),
      },
      {
        title: "Gas Premium",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.gasPremium, {
            hideCode: true,
            showAllDigits: true,
          }),
      },
      {
        title: "Gas Fee Cap",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.gasFeeCap, {
            hideCode: true,
            showAllDigits: true,
          }),
      },
      {
        title: "Method",
        button: SpeculosButton.RIGHT,
        expectedValue: () => "Transfer",
      },
      {
        title: "APPROVE",
        button: SpeculosButton.BOTH,
      },
    ],
  });
