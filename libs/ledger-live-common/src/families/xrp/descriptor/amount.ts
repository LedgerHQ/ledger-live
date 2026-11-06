import { BigNumber } from "bignumber.js";
import type { SendAmountDescriptor } from "../../../bridge/descriptor/types";

const IOU_SIGNIFICANT_DIGITS = 16;

export const amount: SendAmountDescriptor = {
  canSendMax: currency => currency.type === "TokenCurrency",
  roundAmount: (currency, value) => {
    const isIou = currency.type === "TokenCurrency" && currency.tokenType === "iou";

    return isIou ? value.precision(IOU_SIGNIFICANT_DIGITS, BigNumber.ROUND_DOWN) : value;
  },
};
