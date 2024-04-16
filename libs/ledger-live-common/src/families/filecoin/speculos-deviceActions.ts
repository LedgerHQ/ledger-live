import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { BotScenario, Methods } from "./utils";
import { isFilEthAddress } from "./bridge/utils/addresses";
import { fromEthAddress, fromString, toEthAddress } from "iso-filecoin/address";

export const generateDeviceActionFlow = (scenario: BotScenario): DeviceAction<Transaction, any> => {
  const data: Parameters<typeof deviceActionFlow<Transaction>>[0] = { steps: [] };
  data.steps = data.steps.concat([
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
    },
  ]);
  if (scenario == BotScenario.F4_RECIPIENT) {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const addr = fromString(transaction.recipient);
        if (isFilEthAddress(addr)) {
          return toEthAddress(addr) + transaction.recipient;
        }
        return "unexpected flow... address should be eth type";
      },
    });
  } else if (scenario == BotScenario.ETH_RECIPIENT) {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const addr = fromEthAddress(transaction.recipient, "mainnet");
        return transaction.recipient + addr.toString();
      },
    });
  } else {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    });
  }

  data.steps = data.steps.concat([
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.nonce.toString(),
    },
    {
      title: "Value",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.amount, {
          hideCode: true,
          showAllDigits: true,
        }),
    },
    {
      title: "Gas Limit",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.gasLimit.toFixed(),
    },
    {
      title: "Gas Premium",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction }) =>
        formatDeviceAmount(account.currency, transaction.gasPremium, {
          hideCode: true,
          showAllDigits: true,
        }),
    },
    {
      title: "Gas Fee Cap",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction }) =>
        formatDeviceAmount(account.currency, transaction.gasFeeCap, {
          hideCode: true,
          showAllDigits: true,
        }),
    },
  ]);

  if (scenario == BotScenario.ETH_RECIPIENT || scenario == BotScenario.F4_RECIPIENT) {
    data.steps.push({
      title: "Method",
      button: SpeculosButton.RIGHT,
      expectedValue: () => Methods.InvokeEVM.toString(),
    });
  } else {
    data.steps.push({
      title: "Method",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Transfer",
    });
  }

  data.steps.push({
    title: "APPROVE",
    button: SpeculosButton.BOTH,
  });
  return deviceActionFlow(data);
};
