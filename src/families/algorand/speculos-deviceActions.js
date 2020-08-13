// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { extractTokenId } from "./tokens";

// Will be useful when unit is gonna be algo
const expectedAmount = ({ account, status }) =>
  formatCurrencyUnit(account.unit, status.amount, {
    disableRounding: true,
  });

const acceptTransaction: DeviceAction<Transaction, *> = deviceActionFlow({
  steps: [
    {
      title: "Txn Type",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        transaction.subAccountId ? "Asset xfer" : "Payment",
    },
    {
      title: "Asset xfer",
      button: "Rr",
    },
    {
      title: "Payment",
      button: "Rr",
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(account.unit, status.estimatedFees, {
          disableRounding: true,
        }),
    },
    {
      title: "Asset ID",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        transaction.assetId
          ? extractTokenId(transaction.assetId)
          : transaction.subAccountId
          ? extractTokenId(transaction.subAccountId)
          : "",
    },
    {
      title: "Asset amt",
      button: "Rr",
      expectedValue: ({ transaction }) =>
        transaction.mode === "optIn" ? "0" : transaction.amount.toString(),
    },
    {
      title: "Receiver",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Asset dst",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, status, transaction }) =>
        transaction.mode === "claimReward"
          ? "0"
          : expectedAmount({ account, status }),
    },
    {
      title: "Sign",
      button: "LRlr",
    },
    {
      title: "Review",
      button: "Rr",
    },
    {
      title: "Genesis ID",
      button: "Rr",
    }, // Only on testnet
    {
      title: "Genesis hash",
      button: "Rr",
    }, // Only on testnet
  ],
});

export default { acceptTransaction };
