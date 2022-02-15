import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit, findCompoundToken } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

function subAccount(subAccountId, account) {
  const sub = (account.subAccounts || []).find((a) => a.id === subAccountId);
  if (!sub || sub.type !== "TokenAccount")
    throw new Error("expected sub account id " + String(subAccountId));
  return sub;
}

function expectedCompoundToken(t) {
  if (!t) {
    throw new Error("compound token was expected");
  }

  return t;
}

const maxFeesExpectedValue = ({ account, status }) =>
  formatCurrencyUnit(
    {
      ...account.unit,
      code: account.currency.deviceTicker || account.unit.code,
      prefixCode: true,
    },
    status.estimatedFees,
    {
      showCode: true,
      disableRounding: true,
      joinFragmentsSeparator: " ",
    }
  ).replace(/\s/g, " ");

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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

        const unit = !a
          ? {
              ...account.unit,
              code: account.currency.deviceTicker || account.unit.code,
            }
          : (transaction.mode === "compound.withdraw" &&
            transaction.useAllAmount
              ? expectedCompoundToken(findCompoundToken(a.token))
              : a.token
            ).units[0];
        const amount =
          a &&
          a.compoundBalance &&
          transaction.mode === "compound.withdraw" &&
          transaction.useAllAmount
            ? a.compoundBalance
            : status.amount;
        return formatCurrencyUnit(
          {
            ...unit,
            code: account.currency.deviceTicker || account.unit.code,
            prefixCode: true,
          },
          amount,
          {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }
        ).replace(/\s/g, " ");
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
export default {
  acceptTransaction,
};
