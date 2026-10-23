import type { SendAmountDescriptor } from "../../../bridge/descriptor/types";

export const amount: SendAmountDescriptor = {
  // A token's fee and reserve are paid in XRP, so its full balance is spendable
  canSendMax: currency => currency.type === "TokenCurrency",
};
