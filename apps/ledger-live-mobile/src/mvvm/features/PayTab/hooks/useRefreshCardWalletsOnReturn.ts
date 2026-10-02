import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { cardManagementApi } from "@domain/api-card-management";
import { useDispatch } from "~/context/hooks";

export function useRefreshCardWalletsOnReturn(): () => void {
  const dispatch = useDispatch();
  const hasFocusedBefore = useRef(false);

  const refreshCardWallets = useCallback(() => {
    dispatch(cardManagementApi.util.invalidateTags(["CardLinkedWallets", "InternalWallets"]));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedBefore.current) refreshCardWallets();
      hasFocusedBefore.current = true;
    }, [refreshCardWallets]),
  );

  return refreshCardWallets;
}
