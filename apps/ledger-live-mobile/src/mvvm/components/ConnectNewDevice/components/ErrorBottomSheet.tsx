import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorBottomSheetProps = {
  isOpen: boolean;
  /** Called when the user closes the sheet, not when `isOpen` becomes false. */
  onClose: () => void;
  children: React.ReactNode;
};

export function ErrorBottomSheet({
  isOpen,
  onClose,
  children,
}: Readonly<ErrorBottomSheetProps>): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const bottomSheetRef = useBottomSheetRef();
  const isClosingRef = useRef(true);

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      bottomSheetRef.current?.present();
    } else {
      isClosingRef.current = true;
      bottomSheetRef.current?.dismiss();
    }
  }, [bottomSheetRef, isOpen]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;

    isClosingRef.current = true;
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={null}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      backdropPressBehavior="close"
      onClose={handleClose}
      enablePanDownToClose
      testID="connect-new-device-error-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader density="compact" />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </BottomSheet>
  );
}
