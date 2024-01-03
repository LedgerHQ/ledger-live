import { Address } from "@zondax/izari-filecoin/address";
import { Methods, NetworkPrefix } from "@zondax/izari-filecoin/artifacts";
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { BotScenario } from "./utils";

export const generateDeviceActionFlow = (scenario: BotScenario): DeviceAction<Transaction, any> => {
  const data: Parameters<typeof deviceActionFlow<Transaction>>[0] = { steps: [] };
  data.steps = data.steps.concat([
    {
      title: "Please review",
      button: SpeculosButton.RIGHT,
    },
  ]);
  if (scenario == BotScenario.F4_RECIPIENT) {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const addr = Address.fromString(transaction.recipient);
        if (Address.isFilEthAddress(addr)) {
          return addr.toEthAddressHex(true);
        }
        return transaction.recipient;
      },
    });
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    });
  } else if (scenario == BotScenario.ETH_RECIPIENT) {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    });
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const addr = Address.fromEthAddress(NetworkPrefix.Mainnet, transaction.recipient);
        return addr.toString();
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
