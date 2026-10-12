import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";

type DeviceInstructionBottomSheetProps = Readonly<{
  title: string;
  description: string;
  onClose: () => void;
}>;

export function DeviceInstructionBottomSheet({
  title,
  description,
  onClose,
}: DeviceInstructionBottomSheetProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={onClose}
      testID={checksTestIds.allowSheet}
      enableDynamicSizing
    >
      <BottomSheetView>
        <BottomSheetHeader density="expanded" title={title} />
        <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s24" }}>
          <Text typography="body2">{description}</Text>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
