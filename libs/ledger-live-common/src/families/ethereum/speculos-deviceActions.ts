import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

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
        button: "Rr",
      },
      {
        title: "Type",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          if (transaction.mode === "erc20.approve") return "Approve";
          if (transaction.mode === "compound.supply") return "Lend Assets";
          if (transaction.mode === "compound.withdraw") return "Redeem Assets";
          return "";
        },
      },
      {
        title: "Amount",
        button: "Rr",
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

          const amount =
            a &&
            a.compoundBalance &&
            transaction.mode === "compound.withdraw" &&
            transaction.useAllAmount
              ? a.compoundBalance
              : status.amount;

          if (
            a &&
            transaction.mode === "compound.withdraw" &&
            transaction.useAllAmount
          ) {
            return formatDeviceAmount(a.compoundBalance, amount);
          }

          if (a) {
            return formatDeviceAmount(a.token, amount);
          }

          return formatDeviceAmount(account.currency, amount);
        },
      },
      {
        title: "Contract",
        button: "Rr",
      },
      {
        title: "Network",
        button: "Rr",
      },
      {
        title: "Max fees",
        button: "Rr",
        expectedValue: maxFeesExpectedValue,
      },
      {
        // Legacy (ETC..)
        title: "Max Fees",
        button: "Rr",
        expectedValue: maxFeesExpectedValue,
      },
      {
        title: "Address",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Accept",
        button: "LRlr",
      },
      {
        title: "Approve",
        button: "LRlr",
      },
    ],
  });
