import type { DeviceAction } from "../../bot/types";
import type { AlgorandTransaction } from "./types";
import { findTokenById } from "../../currencies";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";
import { extractTokenId, addPrefixToken } from "./tokens";
import { displayTokenValue } from "./deviceTransactionConfig";

export const acceptTransaction: DeviceAction<AlgorandTransaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Txn Type",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) =>
          transaction.subAccountId ? "Asset xfer" : "Payment",
      },
      {
        title: "Asset xfer",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Payment",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Fee",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Asset ID",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, status }) =>
          transaction.mode === "optIn" ? "0" : status.amount.toString(),
      },
      {
        title: "Sender",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Receiver",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Asset dst",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status, transaction }) =>
          transaction.mode === "claimReward"
            ? "0"
            : formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "APPROVE",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Sign",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Genesis ID",
        button: SpeculosButton.RIGHT,
      }, // Only on testnet
      {
        title: "Genesis hash",
        button: SpeculosButton.RIGHT,
      }, // Only on testnet
    ],
  });
