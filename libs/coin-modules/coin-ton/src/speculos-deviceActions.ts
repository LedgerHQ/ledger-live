import {
  SpeculosButton,
  deviceActionFlow,
  formatDeviceAmount,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import { TOKEN_TRANSFER_MAX_FEE } from "./constants";
import type { Transaction } from "./types";
import { BotScenario } from "./utils";

export const generateDeviceActionFlow = (
  scenario: BotScenario,
): DeviceAction<Transaction, State<Transaction>> => {
  const data: Parameters<typeof deviceActionFlow<Transaction>>[0] = {
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
    ],
  };

  if (scenario === "token-transfer") {
    data.steps = data.steps.concat([
      {
        title: "Transfer jetton",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Jetton wallet (1/2)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Jetton wallet (2/2)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: () => `TON ${TOKEN_TRANSFER_MAX_FEE}`,
      },
      {
        title: "Jetton units",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.amount.toString(),
      },
      {
        title: "Send jetton to (1/2)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Send jetton to (2/2)",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ]);
  } else {
    data.steps = data.steps.concat([
      {
        title: "To",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          transaction.useAllAmount
            ? "ALL YOUR TONs"
            : formatDeviceAmount(account.currency, transaction.amount),
      },
      {
        title: "Comment",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.comment.text,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ]);
  }
  return deviceActionFlow(data);
};
