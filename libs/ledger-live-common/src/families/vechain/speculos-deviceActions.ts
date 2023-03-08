import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

const expectedAmount = ({ account, status }) =>
  formatCurrencyUnit(account.unit, status.amount, {
    disableRounding: true,
  }) + " MCN";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Starting Balance",
      button: SpeculosButton.RIGHT,
      expectedValue: expectedAmount,
    },
    {
      title: "Send",
      button: SpeculosButton.RIGHT,
      expectedValue: expectedAmount,
    },
    {
      title: "Fee",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, status }) =>
        formatCurrencyUnit(account.unit, status.estimatedFees, {
          disableRounding: true,
        }) + " XLM",
    },
    {
      title: "Destination",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
  ],
});

export default { acceptTransaction };
