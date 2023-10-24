import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { PolkadotAccount, Transaction } from "../types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Staking",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Balances",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Dest",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) => {
        return formatDeviceAmount(account.currency, status.amount, {
          forceFloating: true,
        });
      },
    },
    {
      title: "Chain",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Polkadot",
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) =>
        ((account as PolkadotAccount).polkadotResources?.nonce || 0).toString(),
    },
    {
      title: "Tip",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Controller",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Payee",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Max additional",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Targets",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Era Phase",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Era Period",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Block",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
