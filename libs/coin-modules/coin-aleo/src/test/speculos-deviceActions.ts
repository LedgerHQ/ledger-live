import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import { deviceActionFlow } from "@ledgerhq/coin-framework/bot/specs";
import type { Transaction } from "../types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [],
});
