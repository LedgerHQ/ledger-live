import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeSwapTransactionStatusDialog,
  selectIsSwapTransactionStatusDialogOpen,
  selectSwapTransactionStatusDialogParams,
} from "../swapTransactionStatusDialog";

export function useSwapTransactionStatusDialogViewModel() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const params = useSelector(selectSwapTransactionStatusDialogParams);
  const isOpen = useSelector(selectIsSwapTransactionStatusDialogOpen);
  const isPerps = params?.origin === "perps";

  const onClose = useCallback(() => {
    dispatch(closeSwapTransactionStatusDialog());
  }, [dispatch]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const title = isPerps ? t("perpsTransactionStatus.dialogTitle") : undefined;

  // The dialog opens over the Perps app, so returning to it only closes the dialog.
  const returnAction = useMemo(
    () =>
      isPerps ? { label: t("perpsTransactionStatus.returnToPerps"), onClick: onClose } : undefined,
    [isPerps, onClose, t],
  );

  return {
    isOpen,
    params,
    title,
    returnAction,
    onClose,
    onOpenChange,
  };
}

export type SwapTransactionStatusDialogViewModel = ReturnType<
  typeof useSwapTransactionStatusDialogViewModel
>;
