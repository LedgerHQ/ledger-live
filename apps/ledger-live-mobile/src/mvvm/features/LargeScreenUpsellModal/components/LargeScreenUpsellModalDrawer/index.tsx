import React from "react";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Platform, StyleSheet } from "react-native";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { LargeScreenUpsellModalContent } from "../LargeScreenUpsellModalContent";

type LargeScreenUpsellModalDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCloseFromCta: () => void;
  featureIntroViewModel: FeatureIntroViewModel;
  bottomInset: number;
}>;

export function LargeScreenUpsellModalDrawer({
  isOpen,
  onClose,
  onCloseFromCta,
  featureIntroViewModel,
  bottomInset,
}: LargeScreenUpsellModalDrawerProps) {
  const renderContent = () => {
    if (!isOpen) return null;

    return (
      <BottomSheetView
        style={[styles.container, { paddingBottom: Platform.OS === "ios" ? bottomInset : 0 }]}
      >
        <Box testID="large-screen-upsell-modal-drawer">
          <BottomSheetHeader spacing />
          <LargeScreenUpsellModalContent
            onClose={onClose}
            onCtaPress={onCloseFromCta}
            viewModel={featureIntroViewModel}
          />
        </Box>
      </BottomSheetView>
    );
  };

  return (
    <QueuedDrawerBottomSheet
      key="large-screen-upsell-modal-drawer"
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
    >
      {renderContent()}
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
