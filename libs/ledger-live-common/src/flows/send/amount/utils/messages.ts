import type { TransactionStatus } from "../../../../coin-modules/transaction-types";
import { getStatusError, pickBlockingError } from "./errors";

export type AmountScreenMessage = Readonly<{
  type: "error" | "warning" | "info";
  text: string;
}>;

export type AmountScreenRawMessage = Readonly<{
  type: "error" | "warning" | "info";
  error: Error;
}>;

export type AmountScreenStatus = Readonly<Pick<TransactionStatus, "errors" | "warnings">>;

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

const AMOUNT_INPUT_BLOCKING_RECIPIENT_ERROR_SUFFIX = "SourceHasMultiSign";

export function isAmountInputBlockingRecipientError(error: Error | undefined): boolean {
  return error?.name.endsWith(AMOUNT_INPUT_BLOCKING_RECIPIENT_ERROR_SUFFIX) ?? false;
}

export function isAmountInputDisabledByRecipientError(status: AmountScreenStatus): boolean {
  return isAmountInputBlockingRecipientError(getStatusError(status.errors, "recipient"));
}

export function getAmountScreenRawMessage(params: {
  status: AmountScreenStatus;
  hasRawAmount: boolean;
}): AmountScreenRawMessage | null {
  const amountError = params.status.errors?.amount;
  const amountWarning = params.status.warnings?.amount ?? params.status.warnings?.feeTooHigh;
  const recipientError = getStatusError(params.status.errors, "recipient");

  if (recipientError && isAmountInputBlockingRecipientError(recipientError)) {
    return { type: "error", error: recipientError };
  }

  if (amountError && amountError.name !== "AmountRequired" && params.hasRawAmount) {
    return { type: "error", error: amountError };
  }

  const otherBlockingError = pickBlockingError(params.status.errors);
  if (otherBlockingError && otherBlockingError.name !== "AmountRequired" && params.hasRawAmount) {
    return { type: "error", error: otherBlockingError };
  }

  if (amountWarning && params.hasRawAmount) {
    const isFeeTooHigh = amountWarning.name === "FeeTooHigh";

    return { type: isFeeTooHigh ? "info" : "warning", error: amountWarning };
  }

  return null;
}
