import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { StyleSheet } from "react-native";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { CarouselContent } from "./CarouselContent";
import { FeatureIntroContent } from "./FeatureIntroContent";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";

type GenericAwarenessModalDrawerViewProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  data: GenericAwarenessModalContentCard | undefined;
  bottomInset: number;
}>;

export function GenericAwarenessModalDrawerView({
  isOpen,
  onClose,
  data,
  bottomInset,
}: GenericAwarenessModalDrawerViewProps) {
  if (!data) {
    return null;
  }
  const isCarousel = data.layout === "carousel";

  const renderContent = () => {
    // QueuedDrawerBottomSheet renders children even when closed
    if (!isOpen) return null;

    if (data.layout === "carousel") {
      return <CarouselContent slides={data.data} onClose={onClose} />;
    }

    if (data.layout === "featureIntro") {
      return <FeatureIntroContent content={data} onClose={onClose} />;
    }

    return null;
  };

  return (
    <QueuedDrawerBottomSheet
      key={data.id} // force show the bottom sheet when the user retriggers the generic awareness modal
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="generic-awareness-modal-drawer"
      snapPoints={data.layout === "carousel" ? ["92%"] : undefined}
      enableDynamicSizing={data.layout !== "carousel"}
    >
      <BottomSheetView
        style={[styles.container, isCarousel && styles.fullHeight, { paddingBottom: bottomInset }]}
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
