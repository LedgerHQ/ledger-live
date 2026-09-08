import { useMemo } from "react";
import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
  type PayCardStatus,
} from "@domain/api-card-management";
import type { FreezeCardViewProps } from "../../types";

function resolveOptimisticFrozen(
  statusFromApi: PayCardStatus["status"] | undefined,
  isFreezeLoading: boolean,
  isUnfreezeLoading: boolean,
): boolean {
  if (isFreezeLoading) return true;
  if (isUnfreezeLoading) return false;
  return statusFromApi === "FROZEN";
}

export function useFreezeCardViewModel(): FreezeCardViewProps {
  const { data: cardStatus, isLoading: isStatusLoading } = useGetCardStatusQuery();
  const [freeze, { isLoading: isFreezeLoading, isError: isFreezeError }] = useFreezeCardMutation();
  const [unfreeze, { isLoading: isUnfreezeLoading, isError: isUnfreezeError }] =
    useUnfreezeCardMutation();

  return useMemo(() => {
    const statusFromApi = cardStatus?.status;
    const isFrozen = resolveOptimisticFrozen(statusFromApi, isFreezeLoading, isUnfreezeLoading);

    return {
      isFrozen,
      isBlocked: statusFromApi === "BLOCKED",
      isStatusLoading,
      isFreezeLoading,
      isUnfreezeLoading,
      isFreezeError,
      isUnfreezeError,
      onFreeze: () => void freeze(),
      onUnfreeze: () => void unfreeze(),
    };
  }, [
    cardStatus,
    isStatusLoading,
    isFreezeLoading,
    isUnfreezeLoading,
    isFreezeError,
    isUnfreezeError,
    freeze,
    unfreeze,
  ]);
}
