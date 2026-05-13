import React, { useCallback } from "react";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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
  const { bottom: bottomInset } = useSafeAreaInsets();
  const isOpen = useSelector(selectIsSwapTransactionStatusDrawerOpen);
  const params = useSelector(selectSwapTransactionStatusDrawerParams);
  const closeDrawer = useCallback(() => {
    dispatch(closeSwapTransactionStatusDrawer());
  }, [dispatch]);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={closeDrawer}
      noCloseButton
      snapPoints="full"
      testID="swap-transaction-status-drawer"
    >
      <BottomSheetView style={{ paddingHorizontal: 16, paddingBottom: bottomInset + 24 }}>
        <SwapTransactionStatusHeader onClose={closeDrawer} />
        {isOpen && params ? (
          <SwapTransactionStatusDrawerBody params={params} onClose={closeDrawer} />
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
