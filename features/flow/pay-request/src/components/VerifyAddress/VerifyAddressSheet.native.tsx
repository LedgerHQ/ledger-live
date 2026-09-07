import React from "react";
import { BottomSheetView, Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

type SheetIcon = typeof ShieldLock;

type VerifyAddressSheetProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  sheetTestId: string;
  contentTestId: string;
  icon: SheetIcon;
  title: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
  ctaTestId: string;
  children?: React.ReactNode;
  bottomInset?: number;
}>;

export function VerifyAddressSheet({
  isOpen,
  onClose,
  sheetTestId,
  contentTestId,
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaTestId,
  children,
  bottomInset = 0,
}: VerifyAddressSheetProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID={sheetTestId}
    >
      {isOpen ? (
        <BottomSheetView style={{ paddingHorizontal: 16, paddingBottom: bottomInset + 24 }}>
          <Box lx={{ gap: "s24", paddingTop: "s24" }} testID={contentTestId}>
            <Box lx={{ alignItems: "center", gap: "s12" }}>
              <Spot appearance="icon" icon={icon} size={56} />
              <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {title}
              </Text>
              {description ? (
                <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
                  {description}
                </Text>
              ) : null}
            </Box>
            {children}
            <Button appearance="base" size="lg" isFull onPress={onCta} testID={ctaTestId}>
              {ctaLabel}
            </Button>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
