import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  openReceiveOptionsDrawer,
  closeReceiveOptionsDrawer,
  receiveOptionsDrawerStateSelector,
} from "~/reducers/receiveOptionsDrawer";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
/**
 * Hook to manage the global state of the Receive Options Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the receive options drawer
 * - Handle drawer state through Redux
 */
export const useReceiveOptionsDrawerController = () => {
  const dispatch = useDispatch();

  const { isOpen, currency, currencyIds, sourceScreenName, fromMenu } = useSelector(
    receiveOptionsDrawerStateSelector,
  );

  const openDrawer = useCallback(
    (params?: {
      currency?: CryptoOrTokenCurrency;
      currencyIds?: string[];
      sourceScreenName: string;
      fromMenu?: boolean;
    }) => {
      dispatch(
        openReceiveOptionsDrawer({
          currency: params?.currency,
          currencyIds: params?.currencyIds,
          sourceScreenName: params?.sourceScreenName ?? "",
          fromMenu: params?.fromMenu,
        }),
      );
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeReceiveOptionsDrawer());
  }, [dispatch]);

  return {
    isOpen,
    currency,
    currencyIds,
    sourceScreenName,
    fromMenu,
    openDrawer,
    closeDrawer,
  };
};
