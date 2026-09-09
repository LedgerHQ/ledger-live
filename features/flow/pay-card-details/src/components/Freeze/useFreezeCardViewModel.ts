import { useCallback, useMemo, useState } from "react";
import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
} from "@domain/api-card-management";
import type { FreezeViewProps } from "../../types";

export function useFreezeCardViewModel(): FreezeViewProps {
  const { data: cardStatus, isLoading: isStatusLoading } = useGetCardStatusQuery();
  const [freeze, { isLoading: isFreezeLoading }] = useFreezeCardMutation();
  const [unfreeze, { isLoading: isUnfreezeLoading }] = useUnfreezeCardMutation();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const statusFromApi = cardStatus?.status;
  const isFrozen = statusFromApi === "FROZEN";
  const isBlocked = statusFromApi === "BLOCKED";
  const isUpdating = isFreezeLoading || isUnfreezeLoading;

  const onOpenConfirm = useCallback(() => setIsConfirmOpen(true), []);
  const onCloseConfirm = useCallback(() => setIsConfirmOpen(false), []);
  const onConfirm = useCallback(() => {
    setIsConfirmOpen(false);
    if (isFrozen) {
      unfreeze();
    } else {
      freeze();
    }
  }, [isFrozen, freeze, unfreeze]);

  return useMemo(
    () => ({
      isFrozen,
      isUpdating,
      isActionDisabled: isBlocked || isStatusLoading || isUpdating,
      isConfirmOpen,
      onOpenConfirm,
      onCloseConfirm,
      onConfirm,
    }),
    [
      isFrozen,
      isUpdating,
      isBlocked,
      isStatusLoading,
      isConfirmOpen,
      onOpenConfirm,
      onCloseConfirm,
      onConfirm,
    ],
  );
}
