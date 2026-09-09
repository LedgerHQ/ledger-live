import { useCallback, useMemo, useState } from "react";
import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
} from "@domain/api-card-management";
import type { ConfirmState, TileProps } from "../../types";

export function useFreezeCardViewModel(): TileProps {
  const { data: cardStatus, isLoading: isStatusLoading } = useGetCardStatusQuery();
  const [freeze] = useFreezeCardMutation();
  const [unfreeze] = useUnfreezeCardMutation();
  const [confirmState, setConfirmState] = useState<ConfirmState>("closed");

  const status = cardStatus?.status;

  const onOpenConfirm = useCallback(() => setConfirmState("idle"), []);
  const onClose = useCallback(() => setConfirmState("closed"), []);
  const onConfirm = useCallback(async () => {
    setConfirmState("pending");
    try {
      await (status === "FROZEN" ? unfreeze() : freeze()).unwrap();
      setConfirmState("closed");
    } catch {
      setConfirmState("error");
    }
  }, [status, freeze, unfreeze]);

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
