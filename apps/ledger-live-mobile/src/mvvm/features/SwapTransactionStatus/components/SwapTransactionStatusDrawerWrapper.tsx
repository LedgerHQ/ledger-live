import React, { useCallback } from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closeSwapTransactionStatusDrawer,
  selectIsSwapTransactionStatusDrawerOpen,
  selectSwapTransactionStatusDrawerParams,
} from "~/reducers/swapTransactionStatusDrawer";
import { SwapTransactionStatusDrawerBody } from "./SwapTransactionStatusDrawerBody";
import { useCloseDrawerOnAndroidBack } from "../hooks/useCloseDrawerOnAndroidBack";

export function SwapTransactionStatusDrawerWrapper() {
  const dispatch = useDispatch();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const isOpen = useSelector(selectIsSwapTransactionStatusDrawerOpen);
  const params = useSelector(selectSwapTransactionStatusDrawerParams);
  const closeDrawer = useCallback(() => {
    dispatch(closeSwapTransactionStatusDrawer());
  }, [dispatch]);

  // Android: close this drawer on hardware back instead of navigating the screens behind it.
  useCloseDrawerOnAndroidBack(isOpen, closeDrawer);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={closeDrawer}
      snapPoints="full"
      testID="swap-transaction-status-drawer"
    >
      <BottomSheetView style={{ paddingHorizontal: 0, paddingBottom: bottomInset + 12 }}>
        <BottomSheetHeader style={{ paddingHorizontal: 16 }} />
        {isOpen && params ? (
          <SwapTransactionStatusDrawerBody params={params} onClose={closeDrawer} />
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
