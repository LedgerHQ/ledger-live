import { SpeculosButton, deviceActionFlow } from "@ledgerhq/coin-framework/bot/specs";
import type { Transaction } from "./types";
import { DeviceAction } from "@ledgerhq/coin-framework/bot/types";

const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    { title: "Address", button: SpeculosButton.RIGHT },
    { title: "Max Fees", button: SpeculosButton.RIGHT },
    {
      title: "Accept",
      button: SpeculosButton.BOTH,
    },
  ],
});

export default { acceptTransaction };
