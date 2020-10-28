// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

function subAccount(subAccountId, account) {
  const sub = (account.subAccounts || []).find((a) => a.id === subAccountId);
  if (!sub || sub.type !== "TokenAccount")
    throw new Error("expected sub account id " + String(subAccountId));
  return sub;
}

const acceptTransaction: DeviceAction<Transaction, *> = deviceActionFlow({
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
        if (transaction.mode === "compound.supply") return "Supply";
        if (transaction.mode === "compound.withdraw") return "Redeem Assets";
        return "";
      },
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, status, transaction }) =>
        transaction.mode === "erc20.approve" && transaction.useAllAmount
          ? "Unlimited " +
            subAccount(transaction.subAccountId, account).token.ticker
          : formatCurrencyUnit(
              {
                ...(transaction.subAccountId
                  ? subAccount(transaction.subAccountId, account).token.units[0]
                  : account.unit),
                prefixCode: true,
              },
              status.amount,
              {
                showCode: true,
                disableRounding: true,
                joinFragmentsSeparator: " ",
              }
            ).replace(/\s/g, " "),
    },
    {
      title: "Contract",
      button: "Rr",
    },
    {
      title: "Max fees",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(
          {
            ...account.unit,
            prefixCode: true,
          },
          status.estimatedFees,
          {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }
        ).replace(/\s/g, " "),
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
  ],
});

export default { acceptTransaction };
