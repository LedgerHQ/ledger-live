import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";

export const acceptTransaction: DeviceAction<
  Transaction,
  any
> = deviceActionFlow({
  steps: [
    {
      title: "Value",
      button: "Rr",
    },
  ],
});
