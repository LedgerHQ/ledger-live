import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import { findTokenById } from "@ledgerhq/coin-framework/currencies/index";
import { displayTokenValue } from "./deviceTransactionConfig";
import { addPrefixToken, extractTokenId } from "./tokens";
import type { AlgorandTransaction } from "./types";

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
          // 34 is max character displayable by nano.
          return token ? displayTokenValue(token).substring(0, 34) : `#${id}`;
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
        expectedValue: ({ account, status, transaction }) => {
          switch (transaction.mode) {
            case "claimReward":
              return "0";

            case "optIn": {
              const token = findTokenById(transaction?.assetId || "");
              if (token) {
                return formatDeviceAmount(token, status.amount, {
                  forceFloating: token.units[0].magnitude > 0 ? true : false,
                });
              }
              break;
            }
          }
          return formatDeviceAmount(account.currency, status.amount);
        },
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
