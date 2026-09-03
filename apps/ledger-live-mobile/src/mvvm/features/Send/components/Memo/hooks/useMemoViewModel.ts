import { useCallback, useEffect, useMemo, useRef } from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { useTranslation } from "~/context/Locale";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendMemoReset } from "../../../context/SendMemoResetContext";
import { useRecipientMemo } from "./useRecipientMemo";

type UseMemoViewModelProps = Readonly<{
  address: string;
  hasMemo: boolean;
}>;

export function useMemoViewModel({ address, hasMemo }: UseMemoViewModelProps) {
  const { t } = useTranslation();
  const { state, uiConfig } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { registerResetViewState } = useSendMemoReset();

  const currency = state.account.currency;
  const currencyId = getMemoFamilyCurrencyId(currency) ?? "";

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
    hasMemo,
    memoDefaultOption,
    memoType: uiConfig.memoType,
    memoTypeOptions,
    onMemoChange: handleMemoChange,
    onMemoSkip: () => {},
    resetKey: `${state.account.account?.id ?? ""}|${currencyId}|${address}`,
  });

  useEffect(
    () => registerResetViewState(memo.resetViewState),
    [memo.resetViewState, registerResetViewState],
  );

  const transactionError = state.transaction.status?.errors?.transaction;
  const memoError = transactionError instanceof Error ? transactionError : undefined;

  return { ...memo, currencyId, memoLabel, memoTypeOptions, uiConfig, memoError };
}
