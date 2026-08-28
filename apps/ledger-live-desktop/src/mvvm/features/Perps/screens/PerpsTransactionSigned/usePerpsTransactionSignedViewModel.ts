import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openSwapTransactionStatusDialog } from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";

export type PerpsTransactionSignedData = {
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
  const { receiveCurrencyTicker, swapId, provider } = data;
  const dispatch = useDispatch();

  const handleViewTransaction = useCallback(() => {
    onClose();
    if (swapId) dispatch(openSwapTransactionStatusDialog({ swapId, provider, origin: "perps" }));
  }, [onClose, dispatch, swapId, provider]);

  return {
    receiveCurrencyTicker,
    handleViewTransaction,
    handleClose: onClose,
  };
}
