import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "@shared/ui-info-state";
import type { RegionRestrictedDrawerViewProps } from "./useRegionRestrictedDrawerViewModel";

function Content({ title, description }: { title: string; description: string }) {
  useBottomSheetBackgroundTone("info");

  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: Globe }}
      size="hug"
      title={title}
      description={description}
      testID="region-restricted-drawer"
    />
  );
}

export function RegionRestrictedDrawerView({
  isOpen,
  title,
  description,
  learnMoreLabel,
  closeLabel,
  onLearnMore,
  onPressClose,
  onDismiss,
}: RegionRestrictedDrawerViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onDismiss} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Content title={title} description={description} />
        <Box lx={{ gap: "s16", paddingHorizontal: "s16", width: "full" }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            icon={ExternalLink}
            onPress={onLearnMore}
            testID="region-restricted-learn-more"
          >
            {learnMoreLabel}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            isFull
            onPress={onPressClose}
            testID="region-restricted-close"
          >
            {closeLabel}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
