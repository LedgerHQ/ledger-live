import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { type LayoutChangeEvent, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { LargeScreenUpsellModalContent } from "../LargeScreenUpsellModalContent";
import type { LargeScreenUpsellDismissMethod } from "../../analytics";

const LARGE_SCREEN_UPSELL_HERO_MAX_HEIGHT = 473;
const BOTTOM_SHEET_CHROME_HEIGHT = 48;

type LargeScreenUpsellModalDrawerProps = Readonly<{
  isOpen: boolean;
  onDismiss: (dismissMethod: LargeScreenUpsellDismissMethod) => void;
  featureIntroViewModel: FeatureIntroViewModel;
  bottomInset: number;
}>;

export function LargeScreenUpsellModalDrawer({
  isOpen,
  onDismiss,
  featureIntroViewModel,
  bottomInset,
}: LargeScreenUpsellModalDrawerProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const bottomSafeArea = Platform.OS === "ios" ? bottomInset : 0;
  const contentCeiling = windowHeight - topInset - bottomSafeArea - BOTTOM_SHEET_CHROME_HEIGHT;
  const [heroHeight, setHeroHeight] = useState(LARGE_SCREEN_UPSELL_HERO_MAX_HEIGHT);
  const [hasRenderedContent, setHasRenderedContent] = useState(isOpen);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const lastExplicitDismissMethodRef = useRef<LargeScreenUpsellDismissMethod | null>(null);
  const hasReportedDismissRef = useRef(false);
  const hasActiveOpeningRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen) {
      setHasRenderedContent(true);
      hasReportedDismissRef.current = false;
      lastExplicitDismissMethodRef.current = null;
      hasActiveOpeningRef.current = true;
    }
  }, [isOpen]);

  const handleModalHide = useCallback(() => {
    if (!isOpenRef.current) {
      setHasRenderedContent(false);
      hasActiveOpeningRef.current = false;
    }
  }, []);

  const reportDismiss = useCallback(
    (dismissMethod: LargeScreenUpsellDismissMethod) => {
      if (!hasActiveOpeningRef.current || hasReportedDismissRef.current) {
        return;
      }

      hasReportedDismissRef.current = true;
      onDismiss(dismissMethod);
    },
    [onDismiss],
  );

  const handleHeaderClosePressed = useCallback(() => {
    lastExplicitDismissMethodRef.current = "close button";
    reportDismiss("close button");
  }, [reportDismiss]);

  const handleBackdropPress = useCallback(() => {
    lastExplicitDismissMethodRef.current = "outside tap";
    reportDismiss("outside tap");
  }, [reportDismiss]);

  const handleClose = useCallback(() => {
    if (lastExplicitDismissMethodRef.current) {
      lastExplicitDismissMethodRef.current = null;
      return;
    }

    reportDismiss("outside tap");
  }, [reportDismiss]);

  const handleContentLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const measuredHeight = nativeEvent.layout.height;

      setHeroHeight(previousHeroHeight => {
        const nonHeroHeight = measuredHeight - previousHeroHeight;
        const availableHeroHeight = Math.floor(contentCeiling - nonHeroHeight);

        return Math.min(LARGE_SCREEN_UPSELL_HERO_MAX_HEIGHT, Math.max(0, availableHeroHeight));
      });
    },
    [contentCeiling],
  );

  const shouldRenderContent = isOpen || hasRenderedContent;

  return (
    <QueuedDrawerBottomSheet
      key="large-screen-upsell-modal-drawer"
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      onHeaderClosePressed={handleHeaderClosePressed}
      onBackdropPress={handleBackdropPress}
      onModalHide={handleModalHide}
      enableDynamicSizing
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
    >
      {shouldRenderContent ? (
        <BottomSheetView
          style={{
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingBottom: Platform.OS === "ios" ? bottomInset : 0,
          }}
        >
          <Box onLayout={handleContentLayout} testID="large-screen-upsell-modal-drawer">
            <BottomSheetHeader spacing />
            <LargeScreenUpsellModalContent
              viewModel={featureIntroViewModel}
              heroHeight={heroHeight}
            />
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedDrawerBottomSheet>
  );
}
