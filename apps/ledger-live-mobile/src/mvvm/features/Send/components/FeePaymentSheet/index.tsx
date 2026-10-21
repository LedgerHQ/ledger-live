import React, { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, BottomSheetView, type useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import { useFeePaymentSheetViewModel } from "./useFeePaymentSheetViewModel";
import { FeePaymentSheetView } from "./FeePaymentSheetView";

type FeePaymentSheetProps = Readonly<{
  sheetRef: ReturnType<typeof useBottomSheetRef>;
}>;

export function FeePaymentSheet({ sheetRef }: FeePaymentSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onDone = useCallback(() => sheetRef.current?.dismiss(), [sheetRef]);
  // The view model stays out here: only props cross into the sheet's portal.
  const { onClose, ...viewModel } = useFeePaymentSheetViewModel({ onDone });

  return (
    <BottomSheet ref={sheetRef} enableDynamicSizing snapPoints={null} onClose={onClose}>
      <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
        <FeePaymentSheetView {...viewModel} />
      </BottomSheetView>
    </BottomSheet>
  );
}
