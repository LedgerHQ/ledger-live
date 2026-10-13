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
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Lottie, resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { UnsupportedFirmwareVersionView } from "LLM/components/DeviceIntentExecutor/ContextInitializer/components/UnsupportedFirmwareVersion/UnsupportedFirmwareVersionView";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksIllustration, ChecksViewProps } from "./useChecksScreenViewModel";
import loadingAnimation from "./animations/loading.lottie";
import scanAnimation from "./animations/security-check.lottie";
import successAnimation from "./animations/success.lottie";

const illustrationHeight = 200;
const illustrationSize = 96;
const illustrationSources: Record<ChecksIllustration, LottieSource> = {
  loading: resolveLottieSource(loadingAnimation),
  scan: resolveLottieSource(scanAnimation),
  success: resolveLottieSource(successAnimation),
};

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
      <Lottie
        key={kind}
        source={illustrationSources[kind]}
        loop
        style={{ width: illustrationSize, height: illustrationSize }}
      />
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
  const { bottom: bottomInset } = useSafeAreaInsets();

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
          onHeaderClosePressed={allowSheet.onClose}
          preventBackdropClick
          enablePanDownToClose={false}
          testID={checksTestIds.allowSheet}
          enableDynamicSizing
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
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
          onHeaderClosePressed={updateSheet.onClose}
          preventBackdropClick
          enablePanDownToClose={false}
          testID={checksTestIds.updateSheet}
          enableDynamicSizing
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
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
