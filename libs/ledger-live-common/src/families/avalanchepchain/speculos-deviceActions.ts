import type { DeviceAction } from "../../bot/types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";
import type { Transaction } from "./types";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import { getAccountUnit } from "../../account";

const nonBreakableSpace = " ";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Sign",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Validator",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Start time",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const unix = (transaction.startTime as BigNumber)
            .times(1000)
            .toNumber();
          const utc = new Date(unix)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
          return `${utc} UTC`;
        },
      },
      {
        title: "End time",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const unix = (transaction.endTime as BigNumber)
            .times(1000)
            .toNumber();
          const utc = new Date(unix)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
          return `${utc} UTC`;
        },
      },
      {
        title: "Total Stake",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, account }) => {
          return formatCurrencyUnit(
            getAccountUnit(account),
            transaction.amount,
            {
              disableRounding: true,
              showCode: true,
            }
          ).replace(nonBreakableSpace, " ");
        },
      },
      {
        title: "Reject",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Next",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Stake",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Rewards To",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, account }) => {
          return formatCurrencyUnit(
            getAccountUnit(account),
            transaction.fees as BigNumber,
            {
              disableRounding: true,
              showCode: true,
            }
          ).replace(nonBreakableSpace, " ");
        },
      },
      {
        title: "Finalize",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Transaction",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
  });
