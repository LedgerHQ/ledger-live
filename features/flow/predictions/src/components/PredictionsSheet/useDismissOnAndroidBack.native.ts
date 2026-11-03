import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * gorhom bottom sheets don't capture the Android hardware back, which would otherwise reach the
 * live app's webview and navigate behind the still-open sheet. Same approach as
 * SwapTransactionStatus' useCloseDrawerOnAndroidBack.
 */
export function useDismissOnAndroidBack(isOpen: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onDismiss();
      return true;
    });

    return () => subscription.remove();
  }, [isOpen, onDismiss]);
}
