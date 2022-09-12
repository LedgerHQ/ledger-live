import type { DeviceAction } from "../../bot/types";
import type { PolkadotAccount, Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Staking",
        button: "Rr",
      },
      {
        title: "Balances",
        button: "Rr",
      },
      {
        title: "Dest",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatDeviceAmount(account.currency, transaction.amount, {
            forceFloating: true,
          }),
      },
      {
        title: "Chain",
        button: "Rr",
        expectedValue: () => "Polkadot",
      },
      {
        title: "Nonce",
        button: "Rr",
        expectedValue: ({ account }) =>
          (
            (account as PolkadotAccount).polkadotResources?.nonce || 0
          ).toString(),
      },
      {
        title: "Tip",
        button: "Rr",
      },
      {
        title: "Controller",
        button: "Rr",
      },
      {
        title: "Payee",
        button: "Rr",
      },
      {
        title: "Max additional",
        button: "Rr",
      },
      {
        title: "Targets",
        button: "Rr",
      },
      {
        title: "Era Phase",
        button: "Rr",
      },
      {
        title: "Era Period",
        button: "Rr",
      },
      {
        title: "Block",
        button: "Rr",
      },
      {
        title: "APPROVE",
        button: "LRlr",
      },
    ],
  });
