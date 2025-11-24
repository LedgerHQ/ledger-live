import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { deviceActionFlow } from "@ledgerhq/coin-framework/bot/specs";
import { State } from "@ledgerhq/coin-framework/bot/types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [],
});
