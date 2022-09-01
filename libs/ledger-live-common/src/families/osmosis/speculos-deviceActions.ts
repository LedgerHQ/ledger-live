import type { DeviceAction } from "../../bot/types";
import { deviceActionFlow } from "../../bot/specs";
import type { Transaction } from "./types";
const typeWording = {
  send: "Send",
  delegate: "Delegate",
  redelegate: "Redelegate",
  undelegate: "Undelegate",
  claimReward: "Withdraw Reward",
  claimRewardCompound: "(not tested)",
};

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Sequence",
        button: "Rr",
      },
      {
        title: "Chain ID",
        button: "Rr",
      },
      {
        title: "Account",
        button: "Rr",
      },
      {
        title: "Type",
        button: "Rr",
        expectedValue: ({ transaction }) => typeWording[transaction.mode],
      },
      {
        title: "Validator Source",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.sourceValidator || "",
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
      },
      {
        title: "Gas",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.gas?.toString() || "",
      },
      {
        title: "Amount",
        button: "Rr",
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
        title: "APPROVE",
        button: "LRlr",
        final: true,
      },
      {
        title: "REJECT",
      },
    ],
  });
