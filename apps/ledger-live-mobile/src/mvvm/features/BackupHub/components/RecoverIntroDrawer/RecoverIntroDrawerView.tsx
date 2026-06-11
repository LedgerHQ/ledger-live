import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { FeatureIntroLayout } from "LLM/components/FeatureIntroLayout";
import type { UseRecoverIntroDrawerViewModelResult } from "./useRecoverIntroDrawerViewModel";

type RecoverIntroDrawerViewProps = UseRecoverIntroDrawerViewModelResult;

const containerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

export function RecoverIntroDrawerView({
  isOpen,
  bottomInset,
  featureIntroViewModel,
  onDismiss,
  onCloseFromCta,
}: RecoverIntroDrawerViewProps) {
  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onDismiss}
      testID="backup-hub-feature-intro-drawer"
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset }}>
        <Box lx={containerStyle}>
          <BottomSheetHeader />
          {isOpen ? (
            <FeatureIntroLayout onClose={onCloseFromCta} viewModel={featureIntroViewModel} />
          ) : null}
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
