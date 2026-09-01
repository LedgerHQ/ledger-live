import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
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
        <Box lx={{ gap: "s32", paddingHorizontal: "s16" }}>
          <BottomSheetHeader />
          <Box lx={{ alignItems: "center", gap: "s24" }}>
            <Spot appearance="icon" size={72} icon={Refresh} />
            <Box lx={{ gap: "s8" }}>
              <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {title}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {description}
              </Text>
            </Box>
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
