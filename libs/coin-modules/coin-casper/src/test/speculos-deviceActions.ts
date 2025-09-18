import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { DeviceAction } from "@ledgerhq/coin-framework/bot/types";

import type { Transaction } from "../types";
import { casperAccountHashFromPublicKey } from "../bridge/bridgeHelpers/addresses";
import { CASPER_NETWORK } from "../consts";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Txn hash",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "Token transfer",
    },
    {
      title: "Chain ID",
      button: SpeculosButton.RIGHT,
      expectedValue: () => CASPER_NETWORK,
    },
    {
      title: "Account",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => casperAccountHashFromPublicKey(account.freshAddress),
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        `${transaction.fees.toNumber().toLocaleString("en-US").replace(/,/g, " ")} motes`,
    },
    {
      title: "Target",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => casperAccountHashFromPublicKey(transaction.recipient),
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) =>
        `${status.amount.toNumber().toLocaleString("en-US").replace(/,/g, " ")} motes`,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
