import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Question } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { HelpPanelProps } from "./HelpPanel.types";

const CONTENT_BOTTOM_SPACING = 16;

function HelpPanelContent({ helpPanel }: HelpPanelProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView
      style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      testID="receive-address-help-panel"
    >
      <BottomSheetHeader density="expanded" title={helpPanel.title} />
      {helpPanel.questions.map(question => (
        <ListItem
          key={question.id}
          onPress={question.onPress}
          testID={`receive-address-help-${question.id}`}
        >
          <ListItemLeading>
            <Spot icon={Question} size={48} />
            <ListItemContent>
              <ListItemTitle>{question.label}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </BottomSheetView>
  );
}

export function HelpPanel({ helpPanel }: HelpPanelProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={helpPanel.onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID="receive-address-help-sheet"
    >
      <HelpPanelContent helpPanel={helpPanel} />
    </QueuedBottomSheet>
  );
}
