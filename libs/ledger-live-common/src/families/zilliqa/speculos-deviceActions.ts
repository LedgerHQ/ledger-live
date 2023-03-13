import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  /*formatDeviceAmount,*/
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";

export const acceptTransaction: DeviceAction<
  Transaction,
  any
> = deviceActionFlow({
  steps: [
    {
      title: "Sign Txn",
      button: SpeculosButton.RIGHT,
    },
    { title: "To (1/3)", button: SpeculosButton.RIGHT },
    { title: "To (2/3)", button: SpeculosButton.RIGHT },
    { title: "To (3/3)", button: SpeculosButton.RIGHT },
    { title: "Amount (ZIL)", button: SpeculosButton.RIGHT },
    { title: "Gasprice (ZIL)", button: SpeculosButton.RIGHT },
    { title: "Sign", button: SpeculosButton.BOTH },
  ],
});
