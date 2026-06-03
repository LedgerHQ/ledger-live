import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { StyleSheet } from "react-native";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { CarouselLayout } from "./CarouselLayout";
import { FeatureIntroLayout } from "./FeatureIntroLayout";
import { PromptLayout } from "./PromptLayout";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type {
  CarouselViewModel,
  FeatureIntroViewModel,
  PromptViewModel,
} from "../screens/useGenericAwarenessModalDrawerViewModel";

type GenericAwarenessModalDrawerViewProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  data: GenericAwarenessModalContentCard | undefined;
  bottomInset: number;
  featureIntroViewModel: FeatureIntroViewModel | undefined;
  carouselViewModel: CarouselViewModel | undefined;
  promptViewModel: PromptViewModel | undefined;
}>;

export function GenericAwarenessModalDrawerView({
  isOpen,
  onClose,
  data,
  bottomInset,
  featureIntroViewModel,
  carouselViewModel,
  promptViewModel,
}: GenericAwarenessModalDrawerViewProps) {
  if (!data) {
    return null;
  }
  const usesFullHeightLayout =
    data.layout === GenericAwarenessModalLayout.Carousel ||
    data.layout === GenericAwarenessModalLayout.Prompt;

  const renderContent = () => {
    // QueuedDrawerBottomSheet renders children even when closed
    if (!isOpen) return null;

    if (data.layout === GenericAwarenessModalLayout.Carousel && carouselViewModel) {
      return <CarouselLayout onClose={onClose} viewModel={carouselViewModel} />;
    }

    if (data.layout === GenericAwarenessModalLayout.Prompt && promptViewModel) {
      return <PromptLayout onClose={onClose} viewModel={promptViewModel} />;
    }

    if (data.layout === GenericAwarenessModalLayout.FeatureIntro && featureIntroViewModel) {
      return <FeatureIntroLayout onClose={onClose} viewModel={featureIntroViewModel} />;
    }

    return null;
  };

  return (
    <QueuedDrawerBottomSheet
      key={data.id} // force show the bottom sheet when the user retriggers the generic awareness modal
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="generic-awareness-modal-drawer"
      snapPoints={usesFullHeightLayout ? ["92%"] : undefined}
      enableDynamicSizing={!usesFullHeightLayout}
    >
      <BottomSheetView
        style={[
          styles.container,
          usesFullHeightLayout && styles.fullHeight,
          { paddingBottom: bottomInset },
        ]}
      >
        <BottomSheetHeader />
        {renderContent()}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  fullHeight: {
    height: "100%",
  },
});
