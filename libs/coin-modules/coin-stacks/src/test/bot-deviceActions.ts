import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { getSubAccount } from "../bridge/utils/token";
import { getTokenContractDetails } from "../bridge/utils/transactions";

export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Origin",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.nonce ? transaction.nonce.toFixed() : "0"),
    },
    {
      title: "Fee (uSTX)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.fee ? transaction.fee.toFixed() : "0"),
    },
    {
      title: "Amount uSTX",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) => status.amount.toFixed(),
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Memo",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.memo || "",
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});

// TODO Once app supports clear signing for tokens transfer, we should adapt this device action to match that flow
export const acceptTokenTransfer: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Please",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "review",
    },
    {
      title: "Origin",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Nonce",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.nonce ? transaction.nonce.toFixed() : "0"),
    },
    {
      title: "Fee (uSTX)",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => (transaction.fee ? transaction.fee.toFixed() : "0"),
    },
    {
      title: "Contract address",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) => {
        const subAccount = getSubAccount(account, transaction);
        const tokenDetails = getTokenContractDetails(subAccount);
        return tokenDetails?.contractAddress || "";
      },
    },
    {
      title: "Contract name",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) => {
        const subAccount = getSubAccount(account, transaction);
        const tokenDetails = getTokenContractDetails(subAccount);
        return tokenDetails?.contractName || "";
      },
    },
    {
      title: "Function name",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "transfer",
    },
    {
      title: "arg0",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ status }) => status.amount.toFixed(),
    },
    {
      title: "arg1",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "arg2",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "arg3",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) =>
        !transaction.memo ? "is Option: None" : "is Option: Some",
    },
    {
      title: "Principal",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Asset name",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction, account }) => {
        const subAccount = getSubAccount(account, transaction);
        const tokenDetails = getTokenContractDetails(subAccount);
        return tokenDetails?.assetName || "";
      },
    },
    {
      title: "Fungi. Code",
      button: SpeculosButton.RIGHT,
      expectedValue: () => "SendEq",
    },
    {
      title: "Token amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.amount.toFixed(),
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
