import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";
import { perCoinLogic } from "./logic";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) => {
          return formatDeviceAmount(account.currency, status.amount);
        },
      },
      {
        title: "Address",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction, account }, prevSteps) => {
          const perCoin = perCoinLogic[account.currency.id];

          // if there's already one "Address" step done it means we are on the OP_RETURN step
          if (prevSteps.find((step) => step.title === "Address")) {
            if (
              account.currency.id === "bitcoin" ||
              account.currency.id === "bitcoin_testnet"
            ) {
              return `OP_RETURN 0x${transaction.opReturnData?.toString("hex")}`;
            } else {
              return "OP_RETURN";
            }
          }

          if (perCoin?.onScreenTransactionRecipient) {
            return perCoin.onScreenTransactionRecipient(transaction.recipient);
          }

          return transaction.recipient;
        },
      },
      {
        title: "Fees",
        button: SpeculosButton.RIGHT,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Confirm",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Accept",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ],
  });
