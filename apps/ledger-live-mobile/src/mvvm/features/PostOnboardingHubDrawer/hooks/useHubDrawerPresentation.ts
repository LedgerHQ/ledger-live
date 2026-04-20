import { useEffect } from "react";
import { InteractionManager } from "react-native";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";

type BottomSheetRefObject = ReturnType<typeof useBottomSheetRef>;

export function useHubDrawerPresentation(bottomSheetRef: BottomSheetRefObject, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) {
      bottomSheetRef.current?.dismiss();
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      bottomSheetRef.current?.present();
    });
    return () => task.cancel?.();
  }, [isOpen, bottomSheetRef]);
}
