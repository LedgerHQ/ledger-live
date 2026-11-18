import React from "react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { MemoPanelProps } from "./MemoPanel.types";

export function MemoPanel({ memoPanel }: MemoPanelProps) {
  return (
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
  );
}
