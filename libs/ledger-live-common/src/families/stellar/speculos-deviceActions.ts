import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

const expectedAmount = ({ account, status, transaction }) => {
  if (transaction.assetCode && transaction.assetIssuer) {
    const amount = formatDeviceAmount(account.currency, status.amount, {
      hideCode: true,
    });

    return `${amount} ${transaction.assetCode}@${truncateAddress(
      transaction.assetIssuer,
      3,
      4
    )}`;
  }

  return formatDeviceAmount(account.currency, status.amount, {
    postfixCode: true,
  });
};

const truncateAddress = (stellarAddress: string, start = 6, end = 6) =>
  `${stellarAddress.slice(0, start)}..${stellarAddress.slice(-end)}`;

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Memo Text",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.memoValue || "",
      },
      {
        title: "Max Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatCurrencyUnit(account.unit, status.estimatedFees, {
            disableRounding: true,
          }) + " XLM",
      },
      {
        title: "Sequence Num",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Tx Source",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => truncateAddress(account.freshAddress),
      },
      {
        title: "Operation Type",
        button: SpeculosButton.RIGHT,
        // Operation type can be Payment (or Create Account) or Change Trust.
        // Create Account type is coming from operation, not transaction.
        // Testing in `specs.ts`.
      },
      {
        title: "Change Trust",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) =>
          `${transaction.assetCode || ""}@${truncateAddress(
            transaction.assetIssuer || "",
            3,
            4
          )}`,
        maxY: 5,
      },
      {
        title: "Create Account",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
        maxY: 5,
      },
      {
        title: "Send",
        button: SpeculosButton.RIGHT,
        expectedValue: expectedAmount,
      },
      {
        title: "Destination",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Finalize",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Starting Balance",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Network",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Valid Before (UTC)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Valid After (UTC)",
        button: SpeculosButton.RIGHT,
      },
    ],
  });
