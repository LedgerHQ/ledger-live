import { useLongerPasswordViewModel, type LongerPasswordViewModel } from "@features/flow-app-lock";
import {
  selectHasPassword,
  selectIsLocked,
  selectNeedsLongerPassword,
} from "@features/platform-app-lock";
import { useEffect } from "react";
import { BackHandler, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "~/context/hooks";
import { useAppLockScheme } from "../hooks/useAppLockScheme";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { usePasswordSetup } from "../hooks/usePasswordSetup";

export type LongerPasswordGateViewModel = LongerPasswordViewModel &
  Readonly<{
    isHolding: boolean;
    topInset: number;
    bottomInset: number;
    keyboardHeight: number;
  }>;

export function useLongerPasswordGateViewModel(): LongerPasswordGateViewModel {
  const scheme = useAppLockScheme();
  const hasPassword = useSelector(selectHasPassword);
  const isLocked = useSelector(selectIsLocked);
  const needsLongerPassword = useSelector(selectNeedsLongerPassword);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardInset();
  const { savePassword } = usePasswordSetup();
  const viewModel = useLongerPasswordViewModel({ savePassword });

  const isOwed = scheme === "revamped" && hasPassword && needsLongerPassword;

  // Owed, or under way: the write that ends the flow also clears the mark, so the steps past the
  // first are what keep the screen while the user is told it worked.
  const isHolding = !isLocked && (isOwed || viewModel.step !== "prompt");

  // The unlock screen hands over with its keyboard still up, which would animate away over the
  // sheet. The step that wants one raises it again.
  useEffect(() => {
    if (isHolding) {
      Keyboard.dismiss();
    }
  }, [isHolding]);

  useEffect(() => {
    if (!isHolding) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);

    return () => subscription.remove();
  }, [isHolding]);

  return {
    ...viewModel,
    isHolding,
    topInset: insets.top,
    bottomInset: insets.bottom,
    keyboardHeight,
  };
}
