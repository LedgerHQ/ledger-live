import React from "react";
import { StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { FeatureIntroLayout } from "LLM/features/GenericAwarenessModal/components/FeatureIntroLayout";
import type { UseLedgerRecoverFeatureIntroViewModelResult } from "./useLedgerRecoverFeatureIntroViewModel";

type LedgerRecoverFeatureIntroViewProps = UseLedgerRecoverFeatureIntroViewModelResult;

export function LedgerRecoverFeatureIntroView({
  isOpen,
  bottomInset,
  featureIntroViewModel,
  onClose,
}: LedgerRecoverFeatureIntroViewProps) {
  return (
    <QueuedDrawerBottomSheet
      key="backup-hub-feature-intro"
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="backup-hub-feature-intro-drawer"
      enableDynamicSizing
    >
      <BottomSheetView style={[styles.container, { paddingBottom: bottomInset }]}>
        <BottomSheetHeader />
        {isOpen ? <FeatureIntroLayout onClose={onClose} viewModel={featureIntroViewModel} /> : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});
