import { useMemo } from "react";
import { createIntent } from "@features/platform-device-intent";
import type { AccountDataSignTransactionParams } from "@features/platform-wallet-api-server";
import { signAccountTransactionIntentLWDDefinition } from "../../deviceIntents/intentLWDDefinitions";
import { useSignRequestLifecycle } from "../../hooks/useSignRequestLifecycle";
import { formatAssetAmount } from "../../utils/formatAssetAmount";

export function useTransactionSignViewModel(
  requestId: number,
  params: AccountDataSignTransactionParams,
) {
  const lifecycle = useSignRequestLifecycle(requestId, params.account, params);
  const { prepared } = params.prepared;

  const summary = useMemo(
    () => ({
      recipient: prepared.request.recipient,
      amount: formatAssetAmount(prepared.amount, prepared.request.assetId),
      fees: formatAssetAmount(prepared.fees, prepared.feeAssetId),
      total: formatAssetAmount(prepared.totalSpent, prepared.request.assetId),
      errors: prepared.errors.map(issue => issue.message),
      warnings: prepared.warnings.map(issue => issue.message),
    }),
    [prepared],
  );

  const { sign, onSuccess } = params;
  const intent = useMemo(
    () =>
      createIntent(signAccountTransactionIntentLWDDefinition, { sign }, { onResult: onSuccess }),
    [sign, onSuccess],
  );

  return {
    ...lifecycle,
    summary,
    intent,
    canConfirm: summary.errors.length === 0 && lifecycle.initializationInput !== undefined,
  };
}
