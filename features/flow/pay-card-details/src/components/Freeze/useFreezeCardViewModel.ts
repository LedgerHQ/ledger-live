import { useCallback, useMemo, useState } from "react";
import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
} from "@domain/api-card-management";
import type { FreezeCardViewProps } from "../../types";

export function useFreezeCardViewModel(): FreezeCardViewProps {
  const { data: cardStatus, isLoading: isStatusLoading } = useGetCardStatusQuery();
  const [freeze, { isLoading: isFreezeLoading, isError: isFreezeError }] = useFreezeCardMutation();
  const [unfreeze, { isLoading: isUnfreezeLoading, isError: isUnfreezeError }] =
    useUnfreezeCardMutation();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const statusFromApi = cardStatus?.status;
  const isFrozen = statusFromApi === "FROZEN";

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
      isBlocked: statusFromApi === "BLOCKED",
      isStatusLoading,
      isFreezeLoading,
      isUnfreezeLoading,
      isFreezeError,
      isUnfreezeError,
      isConfirmOpen,
      onOpenConfirm,
      onCloseConfirm,
      onConfirm,
    }),
    [
      isFrozen,
      statusFromApi,
      isStatusLoading,
      isFreezeLoading,
      isUnfreezeLoading,
      isFreezeError,
      isUnfreezeError,
      isConfirmOpen,
      onOpenConfirm,
      onCloseConfirm,
      onConfirm,
    ],
  );
}
