import type { DeviceAction } from "../../bot/types";
import { deviceActionFlow } from "../../bot/specs";
import type { Transaction } from "./types";
import { BigNumber } from "bignumber.js";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Sign",
      button: "Rr",
    },
    {
      title: "Validator",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Start time",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        const unix = (transaction.startTime as BigNumber)
          .times(1000)
          .toNumber();
        const utc = new Date(unix).toISOString().slice(0, 19).replace("T", " ");
        return `${utc} UTC`;
      },
    },
    {
      title: "End time",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        const unix = (transaction.endTime as BigNumber).times(1000).toNumber();
        const utc = new Date(unix).toISOString().slice(0, 19).replace("T", " ");
        return `${utc} UTC`;
      },
    },
    {
      title: "Total Stake",
      button: "Rr",
    },
    {
      title: "Reject",
      button: "Rr",
    },
    {
      title: "Next",
      button: "LRlr",
    },
    {
      title: "Stake",
      button: "Rr",
    },
    {
      title: "Rewards To",
      button: "Rr",
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        `${(transaction.fees as BigNumber).toString()} AVAX`,
    },
    {
      title: "Finalize",
      button: "Rr",
    },
    {
      title: "Transaction",
      button: "Rr",
    },
    {
      title: "Accept",
      button: "LRlr",
      final: true,
    },
  ],
});

export default {
  acceptTransaction,
};
