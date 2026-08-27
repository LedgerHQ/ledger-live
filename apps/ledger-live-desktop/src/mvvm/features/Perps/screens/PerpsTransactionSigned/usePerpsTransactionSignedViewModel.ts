import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openSwapTransactionStatusDialog } from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";

export type PerpsTransactionSignedData = {
  operationId: string;
  accountId: string;
  receiveCurrencyTicker: string;
  swapId?: string;
  provider?: string;
};

export type PerpsTransactionSignedViewModel = {
  receiveCurrencyTicker: string;
  handleViewTransaction: () => void;
  handleClose: () => void;
};

export function usePerpsTransactionSignedViewModel(
  data: PerpsTransactionSignedData,
  onClose: () => void,
): PerpsTransactionSignedViewModel {
  const { operationId, accountId, receiveCurrencyTicker, swapId, provider } = data;
  const dispatch = useDispatch();

  const handleViewTransaction = useCallback(() => {
    onClose();

    if (swapId) {
      dispatch(openSwapTransactionStatusDialog({ swapId, provider }));
      return;
    }

    setDrawer(OperationDetails, { operationId, accountId });
  }, [onClose, dispatch, swapId, provider, operationId, accountId]);

  return {
    receiveCurrencyTicker,
    handleViewTransaction,
    handleClose: onClose,
  };
}
