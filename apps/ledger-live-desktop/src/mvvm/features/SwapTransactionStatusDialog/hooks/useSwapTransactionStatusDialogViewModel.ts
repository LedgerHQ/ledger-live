import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeSwapTransactionStatusDialog,
  selectIsSwapTransactionStatusDialogOpen,
  selectSwapTransactionStatusDialogParams,
} from "../swapTransactionStatusDialog";

export function useSwapTransactionStatusDialogViewModel() {
  const dispatch = useDispatch();
  const params = useSelector(selectSwapTransactionStatusDialogParams);
  const isOpen = useSelector(selectIsSwapTransactionStatusDialogOpen);

  const onClose = useCallback(() => {
    dispatch(closeSwapTransactionStatusDialog());
  }, [dispatch]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return {
    isOpen,
    params,
    onClose,
    onOpenChange,
  };
}

export type SwapTransactionStatusDialogViewModel = ReturnType<
  typeof useSwapTransactionStatusDialogViewModel
>;
