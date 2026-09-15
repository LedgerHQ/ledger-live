import { useCallback, useMemo, useState } from "react";
import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
} from "@domain/api-card-management";
import type { ConfirmState, FreezeViewModel } from "../../types";

/**
 * @param onResolved Called when the confirmation concludes — dismissed or applied — but not while it
 * stays open on an error. Lets a host react (e.g. navigate back) without watching `confirmState`.
 */
export function useFreezeCardViewModel(onResolved?: () => void): FreezeViewModel {
  const { data: cardStatus, isLoading: isStatusLoading } = useGetCardStatusQuery();
  const [freeze] = useFreezeCardMutation();
  const [unfreeze] = useUnfreezeCardMutation();
  const [confirmState, setConfirmState] = useState<ConfirmState>("closed");

  const status = cardStatus?.status;

  const onOpenConfirm = useCallback(() => setConfirmState("prompt"), []);
  const onClose = useCallback(() => {
    setConfirmState("closed");
    onResolved?.();
  }, [onResolved]);
  const onConfirm = useCallback(async () => {
    setConfirmState("pending");
    try {
      await (status === "FROZEN" ? unfreeze() : freeze()).unwrap();
      setConfirmState("closed");
      onResolved?.();
    } catch {
      setConfirmState("error");
    }
  }, [status, freeze, unfreeze, onResolved]);

  return useMemo(
    () => ({
      status,
      isActionDisabled: status === "BLOCKED" || isStatusLoading || confirmState === "pending",
      confirmState,
      onOpenConfirm,
      onClose,
      onConfirm,
    }),
    [status, isStatusLoading, confirmState, onOpenConfirm, onClose, onConfirm],
  );
}
