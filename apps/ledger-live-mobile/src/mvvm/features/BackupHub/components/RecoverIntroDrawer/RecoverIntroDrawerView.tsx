import React from "react";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { FeatureIntroLayout } from "LLM/components/FeatureIntroLayout";
import type { UseRecoverIntroDrawerViewModelResult } from "./useRecoverIntroDrawerViewModel";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";

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
      <BottomSheetScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}>
        <BottomSheetHeader />
        <FeatureIntroLayout onClose={onCloseFromCta} viewModel={featureIntroViewModel} />
      </BottomSheetScrollView>
    </QueuedDrawerBottomSheet>
  );
}
