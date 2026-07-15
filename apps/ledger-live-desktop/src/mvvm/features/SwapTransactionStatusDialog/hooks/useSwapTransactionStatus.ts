import { useCallback } from "react";
import {
  type SwapTransactionStatusParams,
  useSwapTransactionStatusController,
  type SwapTransactionStatusControllerViewModel,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openURL } from "~/renderer/linking";
import { closeSwapTransactionStatusDialog } from "../swapTransactionStatusDialog";

export type SwapTransactionStatusViewModel = SwapTransactionStatusControllerViewModel;

export function useSwapTransactionStatus(
  params: SwapTransactionStatusParams,
): SwapTransactionStatusViewModel {
  const reduxDispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const onAutoRedirect = useCallback(
    (redirectUrl: string) => {
      openURL(redirectUrl, "SwapTransactionStatus_AutoRedirect");
      reduxDispatch(closeSwapTransactionStatusDialog());
    },
    [reduxDispatch],
  );

  return useSwapTransactionStatusController({ params, accounts, onAutoRedirect });
}
