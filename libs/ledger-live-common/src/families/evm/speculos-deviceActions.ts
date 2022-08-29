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
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, status, transaction }) => {
          const a = transaction.subAccountId
            ? subAccount(transaction.subAccountId, account)
            : null;

          const unit = !a
            ? {
                ...account.unit,
                code: account.currency.deviceTicker || account.unit.code,
              }
            : a.token.units[0];
          const amount = status.amount;
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
