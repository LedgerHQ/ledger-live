import type { DeviceAction, State } from "@ledgerhq/ledger-wallet-framework/bot/types";
import { deviceActionFlow } from "@ledgerhq/ledger-wallet-framework/bot/specs";
import type { Transaction } from "../types";

export const acceptTransaction: DeviceAction<Transaction, State<Transaction>> = deviceActionFlow({
  steps: [],
});
