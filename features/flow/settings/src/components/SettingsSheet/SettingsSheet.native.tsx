import React from "react";
import { BottomSheetHeader, Box } from "@ledgerhq/lumen-ui-rnative";
import { SettingsBottomSheet } from "./SettingsBottomSheet";
import type { SettingsSheetProps } from "./SettingsSheet.types";

export function SettingsSheet({
  isOpen,
  title,
  description,
  onClose,
  canClose,
  children,
  testID,
}: SettingsSheetProps) {
  return (
    <SettingsBottomSheet isOpen={isOpen} onClose={onClose} canClose={canClose} testID={testID}>
      <BottomSheetHeader
        density="expanded"
        title={title}
        description={description}
        testID={testID && `${testID}-header`}
      />
      <Box lx={{ gap: "s24" }}>{children}</Box>
    </SettingsBottomSheet>
  );
}
