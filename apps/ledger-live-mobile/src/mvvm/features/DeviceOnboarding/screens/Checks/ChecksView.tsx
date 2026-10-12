import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  IconButton,
  NavBar,
  NavBarTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, Close, ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { UnsupportedFirmwareVersionView } from "LLM/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM/components/UnsupportedFirmwareVersion/UnsupportedFirmwareVersionView";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksIllustration, ChecksViewProps } from "./useChecksScreenViewModel";

const illustrationHeight = 200;

function Illustration({ kind }: Readonly<{ kind: ChecksIllustration }>) {
  return (
    <Box
      lx={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: "s72",
        flexShrink: 1,
      }}
      style={{ height: illustrationHeight }}
    >
      <Box
        lx={{
          width: "s96",
          height: "s96",
          borderRadius: "full",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "mutedTransparent",
        }}
      >
        {kind === "success" ? (
          <CheckmarkCircleFill size={48} color="success" />
        ) : (
          <ShieldLock size={32} color="base" />
        )}
      </Box>
    </Box>
  );
}

export function ChecksView({
  illustration,
  title,
  description,
  primaryLabel,
  primaryTestID,
  primaryLoading,
  onPrimary,
  onQuit,
  closeLabel,
  allowSheet,
  updateSheet,
}: ChecksViewProps) {
  return (
    <Box testID={checksTestIds.screen} lx={{ flex: 1, gap: "s24", backgroundColor: "canvas" }}>
      <NavBar density="compact">
        {onQuit ? (
          <NavBarTrailing>
            <IconButton
              appearance="no-background"
              size="md"
              icon={Close}
              accessibilityLabel={closeLabel}
              testID={checksTestIds.quit}
              onPress={onQuit}
            />
          </NavBarTrailing>
        ) : null}
      </NavBar>
      {illustration ? <Illustration kind={illustration} /> : null}
      <Box lx={{ flexGrow: 1, gap: "s8", paddingHorizontal: "s16", paddingBottom: "s16" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        {description ? (
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        ) : null}
      </Box>
      {primaryLabel ? (
        <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
          {primaryLoading ? (
            <Button appearance="transparent" size="lg" isFull loading>
              {primaryLabel}
            </Button>
          ) : (
            <Button appearance="base" size="lg" isFull testID={primaryTestID} onPress={onPrimary}>
              {primaryLabel}
            </Button>
          )}
        </Box>
      ) : null}
      {allowSheet ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          onClose={allowSheet.onClose}
          testID={checksTestIds.allowSheet}
          enableDynamicSizing
        >
          <BottomSheetView>
            <BottomSheetHeader />
            <Box lx={{ paddingHorizontal: "s16" }}>
              <DeviceActionContent
                action="continue"
                deviceModelId={allowSheet.deviceModelId}
                deviceName={allowSheet.deviceName}
                title={allowSheet.title}
              />
            </Box>
          </BottomSheetView>
        </QueuedBottomSheet>
      ) : null}
      {updateSheet ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          onClose={updateSheet.onClose}
          testID={checksTestIds.updateSheet}
          enableDynamicSizing
        >
          <BottomSheetView>
            <BottomSheetHeader />
            <UnsupportedFirmwareVersionView
              onUpdateLedgerOs={updateSheet.onUpdate}
              onCancel={updateSheet.onCancel}
            />
          </BottomSheetView>
        </QueuedBottomSheet>
      ) : null}
    </Box>
  );
}
