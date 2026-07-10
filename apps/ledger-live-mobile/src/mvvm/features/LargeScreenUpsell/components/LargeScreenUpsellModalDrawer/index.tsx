import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Platform, StyleSheet } from "react-native";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { LargeScreenUpsellModalContent } from "../LargeScreenUpsellModalContent";

type LargeScreenUpsellModalDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  featureIntroViewModel: FeatureIntroViewModel;
  bottomInset: number;
}>;

export function LargeScreenUpsellModalDrawer({
  isOpen,
  onClose,
  featureIntroViewModel,
  bottomInset,
}: LargeScreenUpsellModalDrawerProps) {
  const [hasRenderedContent, setHasRenderedContent] = useState(isOpen);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (isOpen) {
      setHasRenderedContent(true);
    }
  }, [isOpen]);

  const handleModalHide = useCallback(() => {
    if (!isOpenRef.current) {
      setHasRenderedContent(false);
    }
  }, []);

  const shouldRenderContent = isOpen || hasRenderedContent;

  return (
    <QueuedDrawerBottomSheet
      key="large-screen-upsell-modal-drawer"
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onModalHide={handleModalHide}
      enableDynamicSizing
    >
      {shouldRenderContent ? (
        <BottomSheetView
          style={[styles.container, { paddingBottom: Platform.OS === "ios" ? bottomInset : 0 }]}
        >
          <Box testID="large-screen-upsell-modal-drawer">
            <BottomSheetHeader spacing />
            <LargeScreenUpsellModalContent viewModel={featureIntroViewModel} />
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
