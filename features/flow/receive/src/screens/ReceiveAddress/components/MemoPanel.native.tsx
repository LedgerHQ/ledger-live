import React from "react";
import { BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { MemoPanelProps } from "./MemoPanel.types";

const CONTENT_BOTTOM_SPACING = 16;

function MemoPanelContent({ memoPanel }: MemoPanelProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}>
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24" }}>
        <InfoState
          preset="info"
          size="hug"
          title={memoPanel.title}
          description={memoPanel.description}
          primaryCta={{ label: memoPanel.gotItLabel, onPress: memoPanel.onClose }}
          secondaryCta={{
            label: memoPanel.learnMore.label,
            icon: ExternalLink,
            onPress: memoPanel.learnMore.onPress,
          }}
          testID="receive-address-memo-panel"
        />
      </Box>
    </BottomSheetView>
  );
}

export function MemoPanel({ memoPanel }: MemoPanelProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={memoPanel.onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID="receive-address-memo-sheet"
    >
      <MemoPanelContent memoPanel={memoPanel} />
    </QueuedBottomSheet>
  );
}
