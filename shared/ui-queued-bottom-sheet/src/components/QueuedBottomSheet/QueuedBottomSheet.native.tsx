import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Platform, View } from "react-native";
import { BottomSheetFooter, type BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IsInBottomSheetProvider } from "../../contexts/IsInBottomSheetContext";
import { BottomSheetBackgroundContext } from "../../contexts/BottomSheetBackgroundContext";
import { BottomSheetBottomInsetContext } from "../../contexts/BottomSheetBottomInsetContext";
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
 * Matches the manifest. On this setting gorhom stops offsetting the keyboard itself on Android,
 * which is what we want: its offset never lands there, so `QueuedBottomSheetFooter` steps over the
 * keyboard on its own and must not be lifted twice. iOS ignores this prop and keeps gorhom's offset.
 */
const androidKeyboardInputMode = "adjustResize";

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
  restoreOnFocus,
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
    restoreOnFocus,
  });

  const [footerHeight, setFooterHeight] = useState(0);
  const hasFooter = footer !== null && footer !== undefined;
  const contentBottomInset = useContentBottomInset(hasFooter, enableDynamicSizing);

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
      android_keyboardInputMode={androidKeyboardInputMode}
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
            <BottomSheetBottomInsetContext.Provider value={contentBottomInset}>
              <IsInBottomSheetProvider>{children}</IsInBottomSheetProvider>
            </BottomSheetBottomInsetContext.Provider>
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

/**
 * A footer pads over the safe area itself, and `OnscreenNavigationSafeArea` covers it on Android —
 * but only on a fixed-snap-point sheet, since dynamic sizing measures the content view alone and
 * that spacer is its sibling. Whatever is left is the content's to reserve.
 */
function useContentBottomInset(hasFooter: boolean, enableDynamicSizing: boolean): number {
  const insets = useSafeAreaInsets();
  const spacerCoversInset = Platform.OS === "android" && !enableDynamicSizing;
  return hasFooter || spacerCoversInset ? 0 : insets.bottom;
}
