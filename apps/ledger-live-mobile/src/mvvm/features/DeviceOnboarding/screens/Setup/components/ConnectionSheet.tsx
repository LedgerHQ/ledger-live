import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { SetupConnectionSheet } from "../useSetupScreenViewModel";

function ReconnectingSpinner({ size }: Readonly<{ size?: number }>) {
  return <Spinner size={size} />;
}

export function ConnectionSheet({
  state,
  isOpen,
  productName,
  onRetry,
  onGetHelp,
  onClose,
}: SetupConnectionSheet) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const reconnecting = state === "reconnecting";

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onClose}
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      contentHasBottomSpace
      testID={reconnecting ? setupTestIds.reconnectingSheet : setupTestIds.connectionFailedSheet}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>
          {reconnecting ? (
            <InfoState
              preset="spot"
              spotProps={{ icon: ReconnectingSpinner, size: 72 }}
              size="hug"
              title={t("deviceOnboarding.setup.connection.reconnecting.title", { productName })}
              description={t("deviceOnboarding.setup.connection.reconnecting.description", {
                productName,
              })}
            />
          ) : (
            <InfoState
              preset="error"
              size="hug"
              title={t("deviceOnboarding.setup.connection.failed.title", { productName })}
              description={t("deviceOnboarding.setup.connection.failed.description", {
                productName,
              })}
              primaryCta={{
                label: t("deviceOnboarding.setup.connection.failed.retryCta"),
                onPress: onRetry,
                testID: setupTestIds.connectionRetry,
              }}
              secondaryCta={{
                label: t("deviceOnboarding.setup.connection.failed.helpCta"),
                onPress: onGetHelp,
                testID: setupTestIds.connectionHelp,
              }}
            />
          )}
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
