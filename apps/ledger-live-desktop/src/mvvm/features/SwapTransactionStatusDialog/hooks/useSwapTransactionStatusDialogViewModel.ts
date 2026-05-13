import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeSwapTransactionStatusDialog,
  selectSwapTransactionStatusDialogParams,
} from "~/renderer/reducers/swapTransactionStatusDialog";

export function useSwapTransactionStatusDialogViewModel() {
  const dispatch = useDispatch();
  const params = useSelector(selectSwapTransactionStatusDialogParams);
  const isOpen = params !== null;

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
