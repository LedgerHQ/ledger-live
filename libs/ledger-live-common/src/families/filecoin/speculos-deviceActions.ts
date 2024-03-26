import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount, SpeculosButton } from "../../bot/specs";
import { BotScenario, Methods } from "./utils";
import { isFilEthAddress } from "./bridge/utils/addresses";
import { fromEthAddress, fromString, toEthAddress } from "iso-filecoin/address";
import { getSubAccount } from "./bridge/utils/utils";
import invariant from "invariant";
import BigNumber from "bignumber.js";

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
  } else if (scenario == BotScenario.TOKEN_TRANSFER) {
    data.steps.push({
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) => {
        const subAccount = getSubAccount(account, transaction);
        invariant(subAccount, "subAccount is required for token transfer");

        const addr = fromEthAddress(subAccount.token.contractAddress, "mainnet");
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
  ]);

  if (scenario == BotScenario.TOKEN_TRANSFER) {
    data.steps.push({
      title: "Value",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) =>
        formatDeviceAmount(account.currency, new BigNumber(0), {
          hideCode: true,
          showAllDigits: true,
        }),
    });
  } else {
    data.steps.push({
      title: "Value",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatDeviceAmount(account.currency, status.amount, {
          hideCode: true,
          showAllDigits: true,
        }),
    });
  }

  data.steps = data.steps.concat([
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

  if (
    scenario == BotScenario.ETH_RECIPIENT ||
    scenario == BotScenario.F4_RECIPIENT ||
    scenario == BotScenario.TOKEN_TRANSFER
  ) {
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

  if (scenario == BotScenario.TOKEN_TRANSFER) {
    data.steps.push({
      title: "Params",
      button: SpeculosButton.RIGHT,
      // FIXME: this is not working for some reason speculos recieve trucated data
      // happens when there's consecutive "0000000000000000000" in the data
      // expectedValue: ({ transaction }) => {
      //   const addr = convertF4ToEthAddress(transaction.recipient);
      //   return abiEncodeTransferParams(addr, transaction.amount.toString()).slice(2);
      // },
    });
  }

  data.steps.push({
    title: "APPROVE",
    button: SpeculosButton.BOTH,
  });
  return deviceActionFlow(data);
};
