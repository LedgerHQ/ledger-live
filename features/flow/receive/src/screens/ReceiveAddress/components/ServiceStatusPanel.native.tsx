import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ServiceStatusPanelProps } from "./ServiceStatusPanel.types";

/** The open incidents on the network, in a bottom sheet. */
export function ServiceStatusPanel({ serviceStatus }: ServiceStatusPanelProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={serviceStatus.onClose}
      enableDynamicSizing
      testID="receive-address-service-status-sheet"
    >
      <BottomSheetView>
        <BottomSheetHeader density="expanded" title={serviceStatus.title} />
        <Box
          lx={{ gap: "s24", paddingHorizontal: "s16", paddingBottom: "s16" }}
          testID="receive-address-service-status"
        >
          <Box lx={{ gap: "s16" }}>
            {serviceStatus.incidents.map(incident => (
              <Box key={incident.title} lx={{ gap: "s4" }}>
                <Text typography="body1SemiBold" lx={{ color: "base" }}>
                  {incident.title}
                </Text>
                {incident.description ? (
                  <Text typography="body2" lx={{ color: "muted" }}>
                    {incident.description}
                  </Text>
                ) : null}
              </Box>
            ))}
          </Box>
          <Button appearance="base" isFull onPress={serviceStatus.onClose}>
            {serviceStatus.gotItLabel}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
