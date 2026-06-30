import React from "react";
import { Box, BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { FeatureIntroLayout } from "LLM/components/FeatureIntroLayout";
import type { UseRecoverIntroDrawerViewModelResult } from "./useRecoverIntroDrawerViewModel";

type RecoverIntroDrawerViewProps = UseRecoverIntroDrawerViewModelResult;

export function RecoverIntroDrawerView({
  isOpen,
  featureIntroViewModel,
  onDismiss,
  onCloseFromCta,
}: RecoverIntroDrawerViewProps) {
  return (
    <QueuedDrawerBottomSheet
      key="backup-hub-feature-intro-drawer"
      isRequestingToBeOpened={isOpen}
      onClose={onDismiss}
      testID="backup-hub-feature-intro-drawer"
      enableDynamicSizing
    >
      <BottomSheetView>
        <Box lx={{ paddingTop: "s12", paddingBottom: "s12" }}>
          <BottomSheetHeader />
          <FeatureIntroLayout onClose={onCloseFromCta} viewModel={featureIntroViewModel} />
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
