import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const { isOpen, currency, sourceScreenName, fromMenu } = useSelector(
    receiveOptionsDrawerStateSelector,
  );

  const openDrawer = useCallback(
    (params?: {
      currency?: CryptoOrTokenCurrency;
      sourceScreenName: string;
      fromMenu?: boolean;
    }) => {
      dispatch(
        openReceiveOptionsDrawer({
          currency: params?.currency,
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
    sourceScreenName,
    fromMenu,
    openDrawer,
    closeDrawer,
  };
};
