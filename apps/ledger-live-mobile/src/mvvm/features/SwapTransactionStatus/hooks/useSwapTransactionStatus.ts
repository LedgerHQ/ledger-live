import { useCallback } from "react";
import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";
import {
  type SwapTransactionStatusParams,
  useSwapTransactionStatusController,
  type SwapTransactionStatusControllerViewModel,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

export function useSwapTransactionStatus({
  params,
  onClose,
}: {
  params: SwapTransactionStatusParams;
  onClose: () => void;
}): SwapTransactionStatusControllerViewModel {
  const accounts = useSelector(accountsSelector);
  const onAutoRedirect = useCallback(
    (redirectUrl: string) => {
      Linking.openURL(redirectUrl).catch(error => {
        log("swap-transaction-status", "Failed to open auto-redirect URL", {
          error,
          url: redirectUrl,
        });
      });
      onClose();
    },
    [onClose],
  );

  return useSwapTransactionStatusController({ params, accounts, onAutoRedirect });
}
