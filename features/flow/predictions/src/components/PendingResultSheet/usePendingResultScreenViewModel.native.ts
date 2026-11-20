import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useBottomSheetBackgroundSurface,
  useQueuedBottomSheetTurn,
} from "@shared/ui-queued-bottom-sheet";
import type { PendingResultSheetViewProps } from "./PendingResultSheetView.types";
import type { PendingResultScreenViewProps } from "./PendingResultScreenView";

type PendingResultScreenInput = Pick<
  PendingResultSheetViewProps,
  "isOpen" | "contentKey" | "onPresented" | "onDismiss"
>;

/**
 * Takes its turn in the bottom sheet queue, so the screen only shows once the signing prompt before
 * it has closed, and paints the outcome's status glow with the sheets' background.
 */
export function usePendingResultScreenViewModel({
  isOpen,
  contentKey,
  onPresented,
  onDismiss,
}: PendingResultScreenInput): Omit<
  PendingResultScreenViewProps,
  "contentKey" | "testID" | "children"
> {
  const { hasTurn, areBottomSheetsLocked, onHidden } = useQueuedBottomSheetTurn(isOpen, {
    // Only iOS reports a modal's dismissal, and only iOS can't present one while another leaves.
    waitsForHidden: Platform.OS === "ios",
    onClosingAll: onDismiss,
  });
  const [isPresented, setIsPresented] = useState(false);
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const { backgroundContextValue, BackgroundComponent } = useBottomSheetBackgroundSurface();
  // The sheets' background is built for a sheet's position, which a full screen doesn't move.
  const animatedIndex = useSharedValue(0);
  const animatedPosition = useSharedValue(0);

  if (!hasTurn && isPresented) setIsPresented(false);

  // Also when a new request replaces the one on screen, which doesn't show the screen again.
  useEffect(() => {
    if (hasTurn && isPresented) onPresented();
  }, [hasTurn, isPresented, contentKey, onPresented]);

  return {
    isVisible: hasTurn,
    onShow: () => setIsPresented(true),
    onHidden,
    // The Android back button, unless sheets are locked.
    onRequestClose: areBottomSheetsLocked ? undefined : onDismiss,
    topInset,
    bottomInset,
    backgroundContextValue,
    BackgroundComponent,
    animatedIndex,
    animatedPosition,
  };
}
