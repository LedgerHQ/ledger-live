import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { ContactConfirmationDialogProps } from "./ContactConfirmationDialog.types";

export function ContactConfirmationDialog({
  isOpen,
  tone,
  labels,
  isConfirming = false,
  onConfirm,
  onCancel,
  testID,
  confirmTestID,
  cancelTestID,
}: ContactConfirmationDialogProps): React.JSX.Element {
  const isDestructive = tone === "destructive";
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box testID={testID} lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <BottomSheetHeader />
          <Box lx={{ alignItems: "center", gap: "s16" }}>
            <Spot icon={isDestructive ? Trash : InformationFill} size={56} />
            <Box lx={{ alignItems: "center", gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {labels.title}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {labels.description}
              </Text>
            </Box>
          </Box>
          <Box lx={{ gap: "s8" }}>
            <Button
              appearance={isDestructive ? "red" : "base"}
              size="lg"
              isFull
              loading={isConfirming}
              disabled={isConfirming}
              onPress={() => onConfirm()}
              testID={confirmTestID}
            >
              {labels.confirm}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              disabled={isConfirming}
              onPress={onCancel}
              testID={cancelTestID}
            >
              {labels.cancel}
            </Button>
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
