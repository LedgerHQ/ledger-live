import React from "react";
import { Box, Button, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { DeviceInstructionBottomSheet } from "./components/DeviceInstructionBottomSheet";
import type { ChecksViewProps } from "./useChecksScreenViewModel";

export function ChecksView({
  title,
  description,
  primaryLabel,
  primaryTestID,
  onPrimary,
  onQuit,
  closeLabel,
  allowSheet,
}: ChecksViewProps) {
  return (
    <Box
      testID={checksTestIds.screen}
      lx={{ flex: 1, paddingHorizontal: "s24", paddingTop: "s16", gap: "s16" }}
    >
      {onQuit ? (
        <Box lx={{ alignItems: "flex-end" }}>
          <IconButton
            appearance="no-background"
            size="md"
            icon={Close}
            accessibilityLabel={closeLabel}
            testID={checksTestIds.quit}
            onPress={onQuit}
          />
        </Box>
      ) : null}
      <Text typography="heading2">{title}</Text>
      {description ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {description}
        </Text>
      ) : null}
      {onPrimary && primaryLabel ? (
        <Button appearance="base" size="lg" isFull testID={primaryTestID} onPress={onPrimary}>
          {primaryLabel}
        </Button>
      ) : null}
      {allowSheet ? <DeviceInstructionBottomSheet {...allowSheet} /> : null}
    </Box>
  );
}
