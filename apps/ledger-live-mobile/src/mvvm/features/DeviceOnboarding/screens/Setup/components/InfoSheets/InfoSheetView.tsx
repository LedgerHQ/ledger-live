import React from "react";
import { Image, Platform } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { InfoSheetIllustration, InfoSheetProps } from "./useInfoSheetsViewModel";

const illustrationStyles = {
  recoveryPhrase: { width: 206, height: 157, transform: [{ rotate: "-4.43deg" }] },
  recoveryKey: { width: 260, height: 260 },
} as const;

function Illustration({ kind, source }: InfoSheetIllustration) {
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}
      style={{ height: 200 }}
    >
      <Image source={source} style={illustrationStyles[kind]} resizeMode="contain" />
    </Box>
  );
}

export function InfoSheetView({
  isOpen,
  title,
  illustration,
  rows,
  paragraphs,
  linkLabel,
  onOpenLink,
  onClose,
}: InfoSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
      contentHasBottomSpace
      testID={setupTestIds.infoSheet}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BottomSheetHeader title={title} />
        <Box lx={{ gap: "s16", paddingHorizontal: "s8" }}>
          {illustration ? <Illustration {...illustration} /> : null}
          {rows.length > 0 ? (
            <Box>
              {rows.map(row => (
                <Box key={row.title} lx={{ gap: "s4", padding: "s12" }}>
                  <Text typography="body1SemiBold" lx={{ color: "base" }}>
                    {row.title}
                  </Text>
                  <Text typography="body2" lx={{ color: "muted" }}>
                    {row.description}
                  </Text>
                </Box>
              ))}
            </Box>
          ) : null}
          {paragraphs.length > 0 ? (
            <Text typography="body2" lx={{ color: "muted", paddingHorizontal: "s12" }}>
              {paragraphs.join("\n\n")}
            </Text>
          ) : null}
          <Button
            appearance="no-background"
            size="md"
            isFull
            testID={setupTestIds.infoSheetLink}
            onPress={onOpenLink}
          >
            {linkLabel}
          </Button>
        </Box>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
