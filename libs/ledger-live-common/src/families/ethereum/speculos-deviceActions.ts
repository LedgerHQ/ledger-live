import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

function subAccount(subAccountId, account) {
  const sub = (account.subAccounts || []).find((a) => a.id === subAccountId);
  if (!sub || sub.type !== "TokenAccount")
    throw new Error("expected sub account id " + String(subAccountId));
  return sub;
}

const maxFeesExpectedValue = ({ account, status }) =>
  formatDeviceAmount(account.currency, status.estimatedFees);

export const acceptTransaction: DeviceAction<Transaction, any> =
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
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status, transaction }) => {
          const a = transaction.subAccountId
            ? subAccount(transaction.subAccountId, account)
            : null;

          if (
            transaction.mode === "erc20.approve" &&
            transaction.useAllAmount &&
            a
          ) {
            return "Unlimited " + a.token.ticker;
          }

          const amount = status.amount;

          if (a) {
            return formatDeviceAmount(a.token, amount);
          }

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
        title: "Max fees",
        button: SpeculosButton.RIGHT,
        expectedValue: maxFeesExpectedValue,
      },
      {
        // Legacy (ETC..)
        title: "Max Fees",
        button: SpeculosButton.RIGHT,
        expectedValue: maxFeesExpectedValue,
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
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ],
  });
