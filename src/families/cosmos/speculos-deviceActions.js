// @flow
import type { DeviceAction } from "../../bot/types";
import { deviceActionFlow } from "../../bot/specs";
import { formatCurrencyUnit } from "../../currencies";
import type { Transaction } from "./types";

const typeWording = {
  send: "Send",
  delegate: "Delegate",
  redelegate: "Redelegate",
  undelegate: "Undelegate",
  claimReward: "Withdraw Reward",
  claimRewardCompound: "(not tested)",
};

const acceptTransaction: DeviceAction<Transaction, *> = deviceActionFlow({
  steps: [
    {
      title: "Type",
      button: "Rr",
      expectedValue: ({ transaction }) => typeWording[transaction.mode],
    },
    {
      title: "Validator Source",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        transaction.cosmosSourceValidator || "",
    },
    {
      title: "Validator Dest",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.validators[0].address,
    },
    {
      title: "Validator",
      button: "Rr",
      expectedValue: ({ transaction }, acc) =>
        transaction.validators[
          acc.filter((a) => a.title === "Validator").length
        ].address,
    },
    {
      title: "Memo",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.memo || "",
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(
          {
            ...account.unit,
            code: account.currency.deviceTicker || account.unit.code,
          },
          status.estimatedFees,
          {
            disableRounding: true,
            showAllDigits: true,
          }
        ) + " ATOM",
    },
    {
      title: "Gas",
      button: "Rr",
      // FIXME can we get it?
      // expectedValue: () => "",
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, status, transaction }, acc) =>
        formatCurrencyUnit(
          {
            ...account.unit,
            code: account.currency.deviceTicker || account.unit.code,
          },
          transaction.mode === "send"
            ? status.amount
            : transaction.validators[
                acc.filter((a) => a.title === "Amount").length
              ].amount,
          {
            disableRounding: true,
            showAllDigits: true,
          }
        ) + " ATOM",
    },
    {
      title: "From",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "To",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Delegator",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Accept",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
