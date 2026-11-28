import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { IncidentDescription } from "./IncidentDescription";
import type { ServiceStatusPanelProps } from "./ServiceStatusPanel.types";

const CONTENT_BOTTOM_SPACING = 16;

function ServiceStatusContent({ serviceStatus }: ServiceStatusPanelProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      <BottomSheetHeader density="compact" />
      <InfoState
        preset="spot"
        spotProps={{ icon: WarningFill, appearance: "warning" }}
        backgroundTone="error"
        size="hug"
        title={serviceStatus.title}
        description={
          serviceStatus.description && <IncidentDescription parts={serviceStatus.description} />
        }
        primaryCta={{
          label: serviceStatus.continueLabel,
          onPress: serviceStatus.onContinue,
          testID: "receive-address-service-status-continue",
        }}
        testID="receive-address-service-status"
      />
    </BottomSheetScrollView>
  );
}

export function ServiceStatusPanel({ serviceStatus }: ServiceStatusPanelProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={serviceStatus.onContinue}
      enableDynamicSizing
      contentHasBottomSpace
      maxDynamicContentSize={maxDynamicContentSize}
      testID="receive-address-service-status-sheet"
    >
      <ServiceStatusContent serviceStatus={serviceStatus} />
    </QueuedBottomSheet>
  );
}
