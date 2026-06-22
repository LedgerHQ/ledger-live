import { useCallback, useMemo, useRef } from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useTranslation } from "~/context/Locale";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientMemo } from "./useRecipientMemo";

type UseMemoViewModelProps = Readonly<{
  address: string;
  onSkip: () => void;
}>;

export function useMemoViewModel({ address, onSkip }: UseMemoViewModelProps) {
  const { t } = useTranslation();
  const { state, uiConfig } = useSendFlowData();
  const { transaction } = useSendFlowActions();

  const currency = state.account.currency;
  const currencyId = currency?.id ?? "";

  const memoLabel = t([
    `send.newSendFlow.memoLabel.${currencyId}`,
    "send.newSendFlow.memoLabel.default",
  ]);

  const memoDefaultOption = useMemo(
    () => sendFeatures.getMemoDefaultOption(currency ?? undefined),
    [currency],
  );

  const memoTypeOptions = useMemo(() => uiConfig.memoOptions ?? [], [uiConfig.memoOptions]);

  const recipientRef = useRef(state.recipient);
  recipientRef.current = state.recipient;

  const handleMemoChange = useCallback(
    (memo: Memo) => {
      if (!address) return;
      const prev = recipientRef.current;
      const ensName = prev?.address === address ? prev.ensName : undefined;
      transaction.setRecipient({ address, ensName, memo });
    },
    [transaction, address],
  );

  const memo = useRecipientMemo({
    hasMemo: uiConfig.hasMemo,
    memoDefaultOption,
    memoType: uiConfig.memoType,
    memoTypeOptions,
    onMemoChange: handleMemoChange,
    onMemoSkip: onSkip,
    resetKey: `${state.account.account?.id ?? ""}|${currencyId}|${address}`,
  });

  const transactionError = state.transaction.status?.errors?.transaction;
  const memoError = transactionError instanceof Error ? transactionError : undefined;

  return { ...memo, currencyId, memoLabel, memoTypeOptions, uiConfig, memoError };
}
