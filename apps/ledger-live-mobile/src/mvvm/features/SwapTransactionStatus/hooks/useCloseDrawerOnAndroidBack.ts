import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * While the swap transaction status drawer (a gorhom bottom sheet) is open, the Android
 * hardware back button should close it first instead of navigating the screens behind it.
 * gorhom bottom sheets don't capture the hardware back (unlike the RN Modal-based native
 * QueuedDrawer, whose onRequestClose intercepts it), so we wire it up explicitly.
 *
 * Kept local to this feature for now. If we decide every bottom-sheet drawer should behave
 * this way, this belongs in the shared QueuedBottomSheet (pending team alignment).
 */
export function useCloseDrawerOnAndroidBack(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      // Consume the event so it never reaches the navigator behind the drawer.
      return true;
    });

    return () => subscription.remove();
  }, [isOpen, onClose]);
}
