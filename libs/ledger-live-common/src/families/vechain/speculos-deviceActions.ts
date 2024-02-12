import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, SpeculosButton } from "../../bot/specs";

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
