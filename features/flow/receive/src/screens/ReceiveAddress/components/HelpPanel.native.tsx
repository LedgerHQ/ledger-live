import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Question } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { HelpPanelProps } from "./HelpPanel.types";

/** The support questions, in a bottom sheet: each one opens its article. */
export function HelpPanel({ helpPanel }: HelpPanelProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={helpPanel.onClose}
      enableDynamicSizing
      testID="receive-address-help-sheet"
    >
      <BottomSheetView>
        <BottomSheetHeader density="expanded" title={helpPanel.title} />
        <Box
          lx={{ marginHorizontal: "-s8", paddingBottom: "s16" }}
          testID="receive-address-help-panel"
        >
          {helpPanel.questions.map(question => (
            <ListItem
              key={question.id}
              density="expanded"
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
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
