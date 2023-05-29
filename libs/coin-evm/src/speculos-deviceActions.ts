import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";

// FIXME: fix types
const maxFeesExpectedValue = ({
  account,
  status,
}: {
  account: any;
  status: any;
}) => formatDeviceAmount(account.currency, status.estimatedFees);

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
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
        expectedValue: ({ account, status, transaction }) => {
          const subAccount = findSubAccountById(
            account,
            transaction.subAccountId || ""
          );

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

export default {
  acceptTransaction,
};
