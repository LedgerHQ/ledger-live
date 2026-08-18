import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsLedgerSyncIntroductionContentProps } from "./types";

export function ContactsLedgerSyncIntroductionContent({
  isOpen,
  title,
  description,
  activateLabel,
  dismissLabel,
  bottomInset,
  onActivate,
  onDismiss,
}: ContactsLedgerSyncIntroductionContentProps): React.JSX.Element {
  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s12" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {description}
            </Text>
          </Box>
          <Box lx={{ gap: "s16" }}>
            <Button appearance="base" size="lg" isFull onPress={onActivate}>
              {activateLabel}
            </Button>
            <Button appearance="gray" size="lg" isFull onPress={onDismiss}>
              {dismissLabel}
            </Button>
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
