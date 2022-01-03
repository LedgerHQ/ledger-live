import type { DeviceAction } from "../../bot/types";
import type { AlgorandTransaction } from "./types";
import { formatCurrencyUnit, findTokenById } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { extractTokenId, addPrefixToken } from "./tokens";
import { displayTokenValue } from "./deviceTransactionConfig";

// Will be useful when unit is gonna be algo
const expectedAmount = ({ account, status }) =>
  formatCurrencyUnit(account.unit, status.amount, {
    disableRounding: true,
  });

const acceptTransaction: DeviceAction<AlgorandTransaction, any> =
  deviceActionFlow({
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
        expectedValue: ({ transaction }) => {
          const id = transaction.assetId
            ? extractTokenId(transaction.assetId)
            : transaction.subAccountId
            ? extractTokenId(transaction.subAccountId)
            : "";
          const token = findTokenById(addPrefixToken(id));
          return token ? displayTokenValue(token) : `#${id}`;
        },
      },
      {
        title: "Asset amt",
        button: "Rr",
        expectedValue: ({ transaction, status }) =>
          transaction.mode === "optIn" ? "0" : status.amount.toString(),
      },
      {
        title: "Sender",
        button: "Rr",
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
            : expectedAmount({
                account,
                status,
              }),
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
export default {
  acceptTransaction,
};
