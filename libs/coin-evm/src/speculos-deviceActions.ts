/* istanbul ignore file: not reaching userland - bot only. */

import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import { Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

const maxFeesExpectedValue = ({
  account,
  status,
}: {
  account: Account;
  status: TransactionStatusCommon;
}): string => formatDeviceAmount(account.currency, status.estimatedFees);

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status, transaction }): string => {
        const subAccount = findSubAccountById(account, transaction.subAccountId || "");

        if (subAccount && subAccount.type === "TokenAccount") {
          return formatDeviceAmount(subAccount.token, status.amount);
        }

        return formatDeviceAmount(account.currency, status.amount);
      },
    },
    {
      title: "Contract",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Network",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Max fees",
      button: SpeculosButton.RIGHT,
      expectedValue: maxFeesExpectedValue,
    },
    {
      // Legacy (ETC..)
      title: "Max Fees",
      button: SpeculosButton.RIGHT,
      expectedValue: maxFeesExpectedValue,
    },
    {
      title: "Address",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
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

export const avalancheSpeculosDeviceAction: DeviceAction<
  Transaction,
  State<Transaction>
> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Type",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Transfer",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction, status }): string => {
        const amount = transaction.useAllAmount ? status.amount : transaction.amount;

        return formatDeviceAmount(account.currency, amount);
      },
    },
    {
      title: "Contract",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Network",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Fee(GWEI)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
    {
      title: "APPROVE",
      button: SpeculosButton.BOTH,
    },
  ],
});
