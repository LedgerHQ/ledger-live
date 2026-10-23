import React, { useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import Animated, { Easing, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { dismissPredictionsSheet, usePredictionsStep } from "../../predictionsSheetStore.internals";
import { SheetContent } from "./SheetContent";
import { useDismissOnAndroidBack } from "./useDismissOnAndroidBack";

// Same entrance as the modular drawer's screens (ModularDrawer/useScreenTransition).
const STEP_TRANSITION = { duration: 250, easing: Easing.bezier(0.17, 0.84, 0.44, 1) };

function stepEntering() {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.95 }] },
    animations: {
      opacity: withTiming(1, STEP_TRANSITION),
      transform: [{ scale: withTiming(1, STEP_TRANSITION) }],
    },
  };
}

export function PredictionsSheet() {
  const { isOpen, shownStep } = usePredictionsStep();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  // A pending request isn't always on screen: it can wait behind another sheet, or be hidden while
  // its screen is unfocused. Only a sheet the user sees may take the Android back.
  const [isPresented, setIsPresented] = useState(false);

  useDismissOnAndroidBack(isOpen && isPresented, dismissPredictionsSheet);

  return (
    // `onClose` also fires for programmatic closes, late enough to hit the next sheet the live app
    // opens, so only explicit user closes cancel. Pan-down is only reported through `onClose`.
    // Every step sizes the sheet to its content, so gorhom animates the height between steps.
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={dismissPredictionsSheet}
      onBackdropPress={dismissPredictionsSheet}
      onOpened={() => setIsPresented(true)}
      onModalHide={() => setIsPresented(false)}
      enablePanDownToClose={false}
      // A lock or another screen only hides the sheet: the live app's call is still waiting for
      // the user, so the sheet comes back at the same step instead of reading as a close.
      restoreOnFocus
      enableDynamicSizing
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset}
      // Each step already pads its bottom with useBottomSheetBottomInset.
      contentHasBottomSpace
      testID="predictions-sheet"
    >
      {shownStep ? (
        // flexShrink lets the step's scroll view scroll once the sheet hits its max height.
        <Animated.View key={shownStep.key} entering={stepEntering} style={{ flexShrink: 1 }}>
          <SheetContent shownStep={shownStep} />
        </Animated.View>
      ) : null}
    </QueuedBottomSheet>
  );
}
