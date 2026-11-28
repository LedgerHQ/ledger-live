import BigNumber from "bignumber.js";
import { IOU_DIGITS } from "@ledgerhq/coin-xrp/logic-public";
import type { SendAmountDescriptor } from "../../../bridge/descriptor/types";

export const amount: SendAmountDescriptor = {
  canSendMax: currency => currency.type === "TokenCurrency",
  roundAmount: (value, currency) => {
    const isIou = currency.type === "TokenCurrency" && currency.tokenType === "iou";

    return isIou ? value.precision(IOU_DIGITS, BigNumber.ROUND_DOWN) : value;
  },
};
