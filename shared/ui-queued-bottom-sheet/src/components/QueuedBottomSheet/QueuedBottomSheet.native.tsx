import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Platform, View } from "react-native";
import { BottomSheetFooter, type BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IsInBottomSheetProvider } from "../../contexts/IsInBottomSheetContext";
import { BottomSheetBackgroundContext } from "../../contexts/BottomSheetBackgroundContext";
import { BottomSheetFooterInsetContext } from "../../contexts/BottomSheetFooterInsetContext";
import { useQueuedBottomSheet } from "../../internals/useQueuedBottomSheet";
import { BottomSheetInstanceContext } from "../../internals/BottomSheetInstanceContext";
import { GorhomForwardingBottomSheet } from "../../internals/lumenGorhomPassthrough";
import { QueuedBottomSheetFooter } from "../../internals/QueuedBottomSheetFooter";
import {
  createFooterContentStore,
  type FooterContentStore,
} from "../../internals/footerContentStore";
import type { QueuedBottomSheetProps } from "./types";

// Default "switch" only minimizes the outgoing sheet. Lumen forwards this to gorhom.
const replaceStackBehavior = { stackBehavior: "replace" } as const;

/**
 * The manifest declares `adjustResize`, but Android 15 ignores it: the window keeps its height and
 * the keyboard arrives as an inset instead. Told the window resized, gorhom zeroes out the keyboard
 * height and leaves the footer stranded behind the keyboard.
 */
function resolveAndroidKeyboardInputMode(): "adjustPan" | "adjustResize" {
  return Platform.OS === "android" && Number(Platform.Version) >= 35 ? "adjustPan" : "adjustResize";
}

export function QueuedBottomSheet({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onHeaderClosePressed,
  onBackdropPress,
  onBack,
  hasBackButton,
  onOpened,
  onModalHide,
  noCloseButton,
  preventBackdropClick,
  hideHandle,
  children,
  snapPoints = ["70%", "90%"],
  enableDynamicSizing = false,
  enablePanDownToClose,
  enableBlurKeyboardOnGesture,
  enableHandlePanningGesture,
  maxDynamicContentSize,
  footer,
  testID,
}: QueuedBottomSheetProps) {
  const {
    sheetId,
    bottomSheetRef,
    areBottomSheetsLocked,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleAnimate,
    onBack: hookOnBack,
    enablePanDownToClose: computedEnablePanDownToClose,
    backgroundContextValue,
    backgroundComponent,
  } = useQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onHeaderClosePressed,
    onBackdropPress,
    onModalHide,
    preventBackdropClick,
  });

  const [footerHeight, setFooterHeight] = useState(0);
  const hasFooter = footer !== null && footer !== undefined;

  const footerStoreRef = useRef<FooterContentStore | null>(null);
  if (footerStoreRef.current === null) {
    footerStoreRef.current = createFooterContentStore();
  }
  const footerStore = footerStoreRef.current;

  useEffect(() => {
    footerStore.setContent(footer ?? null);
  }, [footer, footerStore]);

  // gorhom memoizes the footer container on this identity, so a new function every render would
  // remount the footer and throw away its measured height.
  const renderFooter = useMemo(
    () =>
      function QueuedBottomSheetFooterSlot(footerProps: BottomSheetFooterProps) {
        return <FooterSlot {...footerProps} store={footerStore} onHeightChange={setFooterHeight} />;
      },
    [footerStore],
  );

  return (
    <GorhomForwardingBottomSheet
      {...replaceStackBehavior}
      ref={bottomSheetRef}
      testID={testID}
      footerComponent={hasFooter ? renderFooter : undefined}
      android_keyboardInputMode={resolveAndroidKeyboardInputMode()}
      snapPoints={enableDynamicSizing ? null : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose ?? computedEnablePanDownToClose}
      enableBlurKeyboardOnGesture={enableBlurKeyboardOnGesture}
      enableHandlePanningGesture={enableHandlePanningGesture}
      maxDynamicContentSize={maxDynamicContentSize}
      hideCloseButton={noCloseButton || areBottomSheetsLocked}
      hideHandle={hideHandle}
      onBack={hasBackButton ? hookOnBack : undefined}
      onHeaderClosePressed={handleHeaderClosePressed}
      onAnimate={handleAnimate}
      onOpen={onOpened}
      onDismiss={handleDismiss}
      backdropPressBehavior={preventBackdropClick || areBottomSheetsLocked ? "none" : "close"}
      onBackdropPress={handleBackdropPress}
      backgroundComponent={backgroundComponent}
    >
      <BottomSheetInstanceContext.Provider value={sheetId}>
        <BottomSheetBackgroundContext.Provider value={backgroundContextValue}>
          <BottomSheetFooterInsetContext.Provider value={hasFooter ? footerHeight : 0}>
            <IsInBottomSheetProvider>{children}</IsInBottomSheetProvider>
          </BottomSheetFooterInsetContext.Provider>
        </BottomSheetBackgroundContext.Provider>
      </BottomSheetInstanceContext.Provider>
      {hasFooter ? null : <OnscreenNavigationSafeArea />}
    </GorhomForwardingBottomSheet>
  );
}

type FooterSlotProps = BottomSheetFooterProps &
  Readonly<{
    store: FooterContentStore;
    onHeightChange: (height: number) => void;
  }>;

function FooterSlot({
  store,
  onHeightChange,
  ...footerProps
}: FooterSlotProps): React.JSX.Element | null {
  const content = useSyncExternalStore(store.subscribe, store.getContent, store.getContent);
  if (content === null || content === undefined) return null;

  return (
    <BottomSheetFooter {...footerProps}>
      <QueuedBottomSheetFooter onHeightChange={onHeightChange}>{content}</QueuedBottomSheetFooter>
    </BottomSheetFooter>
  );
}

function OnscreenNavigationSafeArea() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: Platform.OS === "android" ? insets.bottom : 0 }} />;
}
