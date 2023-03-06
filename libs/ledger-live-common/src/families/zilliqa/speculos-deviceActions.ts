import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow /*, formatDeviceAmount*/ } from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Sign Txn",
        button: "Rr",
      },
      { title: "To (1/3)", button: "Rr" },
      { title: "To (2/3)", button: "Rr" },
      { title: "To (3/3)", button: "Rr" },
      { title: "Amount (ZIL)", button: "Rr" },
      { title: "Gasprice (ZIL)", button: "Rr" },
      { title: "Sign", button: "LRlr" },
    ],
  });
