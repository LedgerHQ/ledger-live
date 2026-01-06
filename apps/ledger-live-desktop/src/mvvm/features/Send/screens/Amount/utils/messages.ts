import { AmountScreenMessage } from "../types";

export function getAmountScreenMessage(params: {
  amountErrorTitle?: string;
  amountWarningTitle?: string;
  isFeeTooHigh: boolean;
  hasRawAmount: boolean;
}): AmountScreenMessage | null {
  if (params.amountErrorTitle && params.hasRawAmount) {
    return { type: "error", text: params.amountErrorTitle };
  }
  if (params.amountWarningTitle && params.hasRawAmount) {
    return { type: params.isFeeTooHigh ? "info" : "warning", text: params.amountWarningTitle };
  }
  return null;
}
