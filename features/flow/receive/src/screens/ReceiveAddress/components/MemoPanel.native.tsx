import React from "react";
import { BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { MemoPanelProps } from "./MemoPanel.types";

export function MemoPanel({ memoPanel }: MemoPanelProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={memoPanel.onClose}
      enableDynamicSizing
      testID="receive-address-memo-sheet"
    >
      <BottomSheetView>
        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", paddingBottom: "s16" }}>
          <InfoState
            preset="info"
            size="hug"
            title={memoPanel.title}
            description={memoPanel.description}
            primaryCta={{ label: memoPanel.gotItLabel, onPress: memoPanel.onClose }}
            secondaryCta={
              memoPanel.learnMore && {
                label: memoPanel.learnMore.label,
                icon: ExternalLink,
                onPress: memoPanel.learnMore.onPress,
              }
            }
            testID="receive-address-memo-panel"
          />
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
