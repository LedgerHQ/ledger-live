import React from "react";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { FeatureIntroLayout } from "LLM/components/FeatureIntroLayout";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

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
      <BottomSheetView style={{ paddingBottom: bottomInset }}>
        <Box
          testID="large-screen-upsell-modal-drawer"
          lx={{ paddingTop: "s12", paddingBottom: "s12", paddingHorizontal: "s16" }}
        >
          <BottomSheetHeader />
          <FeatureIntroLayout onClose={onCloseFromCta} viewModel={featureIntroViewModel} />
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
