import { useCallback } from "react";
import type { PerpsTransactionSignedParams } from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";
import { useDispatch } from "LLD/hooks/redux";
import { openSwapTransactionStatusDialog } from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";

export type PerpsTransactionSignedViewModel = {
  receiveCurrencyTicker: string;
  handleViewTransaction: () => void;
  handleClose: () => void;
};

export function usePerpsTransactionSignedViewModel(
  data: PerpsTransactionSignedParams,
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
