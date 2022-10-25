import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

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
        button: "Rr",
      },
      {
        title: "Memo Text",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.memoValue || "",
      },
      {
        title: "Max Fee",
        button: "Rr",
        expectedValue: ({ account, status }) =>
          formatCurrencyUnit(account.unit, status.estimatedFees, {
            disableRounding: true,
          }) + " XLM",
      },
      {
        title: "Sequence Num",
        button: "Rr",
      },
      {
        title: "Tx Source",
        button: "Rr",
        expectedValue: ({ account }) => truncateAddress(account.freshAddress),
      },
      {
        title: "Operation Type",
        button: "Rr",
        // Operation type can be Payment (or Create Account) or Change Trust.
        // Create Account type is coming from operation, not transaction.
        // Testing in `specs.ts`.
      },
      {
        title: "Change Trust",
        button: "Rr",
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
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
        maxY: 5,
      },
      {
        title: "Send",
        button: "Rr",
        expectedValue: expectedAmount,
      },
      {
        title: "Destination",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Finalize",
        button: "LRlr",
      },
      {
        title: "Starting Balance",
        button: "Rr",
      },
      {
        title: "Network",
        button: "Rr",
      },
      {
        title: "Valid Before (UTC)",
        button: "Rr",
      },
      {
        title: "Valid After (UTC)",
        button: "Rr",
      },
    ],
  });
