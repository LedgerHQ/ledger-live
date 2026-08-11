import { useCallback } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import type { AfterAmountInputProps } from "~/screens/SendFunds/utils/customSendFlow";

/**
 * Send-flow amount-step slot for XRP: re-applies a transaction pushed onto the route params (by
 * `syncTransactionToAmountStep`) so the amount step keeps a tag edited later on the summary
 * instead of reverting to its own stale copy (LIVE-35403). Renders nothing.
 */
export default function XrpAfterAmountInput({ updateTransaction }: AfterAmountInputProps) {
  const setTransaction = useCallback(
    (transaction: Transaction) => updateTransaction(() => transaction),
    [updateTransaction],
  );
  useTransactionChangeFromNavigation(setTransaction);
  return null;
}
