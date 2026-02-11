import { useMemo } from "react";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslatedBridgeError } from "../../Recipient/hooks/useTranslatedBridgeError";
import { getAmountScreenMessage } from "../utils/messages";
import { getStatusError, pickBlockingError } from "../utils/errors";
import type { AmountScreenMessage } from "../types";

export function useAmountScreenMessage(params: {
  status: TransactionStatus;
  accountCurrency: CryptoOrTokenCurrency | undefined;
  amountComputationPending: boolean;
  hasRawAmount: boolean;
}): Readonly<{
  amountMessage: AmountScreenMessage | null;
  isStellarMultisignBlocked: boolean;
}> {
  const amountError = useTranslatedBridgeError(params.status.errors?.amount);

  // Some bridges (e.g., Bitcoin) put FeeTooHigh in warnings.feeTooHigh, others in warnings.amount
  const amountWarningRaw = params.status.warnings?.amount ?? params.status.warnings?.feeTooHigh;
  const amountWarning = useTranslatedBridgeError(amountWarningRaw);

  const recipientErrorRaw = getStatusError(params.status.errors, "recipient");
  const recipientError = useTranslatedBridgeError(recipientErrorRaw);

  const otherBlockingErrorRaw = useMemo(() => {
    const candidate = pickBlockingError(params.status.errors);
    return candidate?.name === "AmountRequired" ? undefined : candidate;
  }, [params.status.errors]);
  const otherBlockingError = useTranslatedBridgeError(otherBlockingErrorRaw);

  // Always hide "AmountRequired" error - the Review button is already disabled when there's no amount,
  // so this error message provides no value and causes visual glitches during input
  const isAmountRequiredError = params.status.errors?.amount?.name === "AmountRequired";

  const amountErrorTitle = amountError && !isAmountRequiredError ? amountError.title : undefined;
  const amountWarningTitle = amountWarning ? amountWarning.title : undefined;

  const isFeeTooHigh =
    params.status.warnings?.amount?.name === "FeeTooHigh" ||
    params.status.warnings?.feeTooHigh?.name === "FeeTooHigh";

  const cryptoCurrency =
    params.accountCurrency?.type === "TokenCurrency"
      ? params.accountCurrency.parentCurrency
      : params.accountCurrency;

  const isStellarMultisignBlocked =
    cryptoCurrency?.family === "stellar" && recipientErrorRaw?.name === "StellarSourceHasMultiSign";

  const multisignMessage =
    isStellarMultisignBlocked && recipientError?.title
      ? ({ type: "error", text: recipientError.title } as const)
      : null;

  const baseAmountMessage = getAmountScreenMessage({
    amountErrorTitle,
    amountWarningTitle: amountErrorTitle ? undefined : amountWarningTitle,
    isFeeTooHigh,
    hasRawAmount: params.hasRawAmount,
  });

  const fallbackBlockingMessage =
    !multisignMessage && !baseAmountMessage && params.hasRawAmount && otherBlockingError?.title
      ? ({ type: "error", text: otherBlockingError.title } as const)
      : null;

  const amountMessage = multisignMessage ?? baseAmountMessage ?? fallbackBlockingMessage;

  return { amountMessage, isStellarMultisignBlocked };
}
