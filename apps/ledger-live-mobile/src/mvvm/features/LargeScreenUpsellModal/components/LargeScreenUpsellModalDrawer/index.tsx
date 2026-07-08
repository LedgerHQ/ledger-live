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
  return (
    <QueuedDrawerBottomSheet
      key="large-screen-upsell-modal-drawer"
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="large-screen-upsell-modal-drawer"
      enableDynamicSizing
    >
      <BottomSheetView>
        <Box lx={{ paddingTop: "s12", paddingBottom: "s12", paddingHorizontal: "s16" }}>
          <BottomSheetHeader />
          <FeatureIntroLayout onClose={onCloseFromCta} viewModel={featureIntroViewModel} />
          <Box lx={{ height: bottomInset }} />
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
