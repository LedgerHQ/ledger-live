import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

// NOTE: Still a WIP

const expectedAmount = ({ account, status }) =>
  formatCurrencyUnit(account.unit, status.amount, {
    disableRounding: true,
  }) + " HBAR";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Starting Balance",
      button: "Rr",
      expectedValue: expectedAmount,
    },
    {
      title: "Send",
      button: "Rr",
      expectedValue: expectedAmount,
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(account.unit, status.estimatedFees, {
          disableRounding: true,
        }) + " HBAR",
    },
    {
      title: "Destination",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Accept",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
