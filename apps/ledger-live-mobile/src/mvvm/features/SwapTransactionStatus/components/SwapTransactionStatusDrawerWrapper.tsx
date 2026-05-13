import React, { useCallback } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closeSwapTransactionStatusDrawer,
  selectIsSwapTransactionStatusDrawerOpen,
  selectSwapTransactionStatusDrawerParams,
} from "~/reducers/swapTransactionStatusDrawer";
import { SwapTransactionStatusDrawerBody } from "./SwapTransactionStatusDrawerBody";
import { SwapTransactionStatusHeader } from "./SwapTransactionStatusHeader";

export function SwapTransactionStatusDrawerWrapper() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isOpen = useSelector(selectIsSwapTransactionStatusDrawerOpen);
  const params = useSelector(selectSwapTransactionStatusDrawerParams);
  const closeDrawer = useCallback(() => {
    dispatch(closeSwapTransactionStatusDrawer());
  }, [dispatch]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={closeDrawer}
      noCloseButton
      containerStyle={{ backgroundColor: theme.colors.bg.base }}
      CustomHeader={() => <SwapTransactionStatusHeader onClose={closeDrawer} />}
    >
      {isOpen && params ? (
        <SwapTransactionStatusDrawerBody params={params} onClose={closeDrawer} />
      ) : null}
    </QueuedDrawer>
  );
}
