import { useMemo } from "react";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useTranslatedBridgeError } from "../../Recipient/hooks/useTranslatedBridgeError";
import {
  getAmountScreenRawMessage,
  isAmountInputDisabledByRecipientError,
} from "@ledgerhq/live-common/flows/send/amount/utils/messages";
import type { AmountScreenMessage } from "../types";

export function useAmountScreenMessage(params: {
  status: TransactionStatus;
  hasRawAmount: boolean;
}): Readonly<{
  amountMessage: AmountScreenMessage | null;
  isAmountInputDisabled: boolean;
}> {
  const rawAmountMessage = useMemo(
    () => getAmountScreenRawMessage({ status: params.status, hasRawAmount: params.hasRawAmount }),
    [params.hasRawAmount, params.status],
  );
  const translatedAmountMessage = useTranslatedBridgeError(rawAmountMessage?.error);

  const amountMessage = useMemo((): AmountScreenMessage | null => {
    if (!rawAmountMessage || !translatedAmountMessage?.title) return null;

    return {
      type: rawAmountMessage.type,
      text: translatedAmountMessage.title,
      error: rawAmountMessage.error,
    };
  }, [rawAmountMessage, translatedAmountMessage?.title]);

  const isAmountInputDisabled = useMemo(
    () => isAmountInputDisabledByRecipientError(params.status),
    [params.status],
  );

  return { amountMessage, isAmountInputDisabled };
}
