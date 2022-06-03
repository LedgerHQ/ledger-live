import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { Unit } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";

function expectedValue(unit: Unit, value: BigNumber) {
  return formatCurrencyUnit(unit, value, {
    showCode: true,
    disableRounding: true,
    showAllDigits: true,
  });
}

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Start new",
    },
    {
      title: "ordinary transaction?",
      button: "Rr",
    },
    {
      title: "Auxiliary data hash",
      button: "LRlr",
    },
    {
      title: "Send to address",
      button: "LRlr",
      ignoreAssertionFailure: true,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Send",
      button: "LRlr",
      ignoreAssertionFailure: true,
      expectedValue: ({ account, status }) =>
        expectedValue(account.unit, status.amount),
    },
    {
      title: "Transaction fee",
      button: "LRlr",
      ignoreAssertionFailure: true,
      expectedValue: ({ account, status }) =>
        expectedValue(account.unit, status.estimatedFees),
    },
    {
      title: "Transaction TTL",
      button: "LRlr",
    },
    {
      title: "...",
    },
    {
      title: "Confirm",
    },
    {
      title: "transaction?",
      button: "Rr",
    },
  ],
});

export default { acceptTransaction };
