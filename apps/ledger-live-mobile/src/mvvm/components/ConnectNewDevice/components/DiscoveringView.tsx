import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import type { SelectableDevice } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
  trackDeviceSelected,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState, ConnectNewDeviceViewProps } from "../types";
import { getScanningMode } from "../utils/getScanningMode";
import { DeviceCard } from "./DeviceCard";
import { StateLayout } from "./StateLayout";

type DiscoveringViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Discovering }
  >;
  onDeviceNotFound?: () => void;
  /** True while an error sheet shows over the view: its page is sent again once the sheet closes. */
  isBehindErrorSheet: boolean;
  checkIsNewDevice: ConnectNewDeviceViewProps["checkIsNewDevice"];
};

export function DiscoveringView({
  state,
  onDeviceNotFound,
  isBehindErrorSheet,
  checkIsNewDevice,
}: Readonly<DiscoveringViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const scanningMode = getScanningMode(state.scanningTransports);
  // Until discovery runs, the scanned transports are unknown.
  const isScanning = state.scanningTransports.length > 0;

  const onPressDeviceNotFound = onDeviceNotFound
    ? () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: CONNECT_DEVICE_BUTTON.DeviceNotFound,
          extraProperties: analyticsProperties,
        });
        onDeviceNotFound();
      }
    : undefined;

  const withSelectionTracking = (selectableDevice: SelectableDevice): SelectableDevice =>
    selectableDevice.isAvailable
      ? {
          ...selectableDevice,
          onSelect: () => {
            trackDeviceSelected({
              sourceFlow,
              device: selectableDevice.device,
              extraProperties: {
                ...analyticsProperties,
                isNewDevice: checkIsNewDevice(selectableDevice.device),
              },
            });
            selectableDevice.onSelect();
          },
        }
      : selectableDevice;

  return (
    <StateLayout
      animation={scanningMode}
      loopAnimation
      title={t("connectNewDevice.discovering.title")}
      description={t(`connectNewDevice.discovering.description.${scanningMode}`)}
      footer={
        state.showDeviceNotFound && onPressDeviceNotFound ? (
          <Button appearance="no-background" size="lg" isFull onPress={onPressDeviceNotFound}>
            {t("connectNewDevice.discovering.deviceNotFound")}
          </Button>
        ) : null
      }
      testID={`connect-new-device-discovering-${scanningMode}`}
    >
      {isScanning && !isBehindErrorSheet && (
        <TrackDIEScreen
          category={PAGE_CONNECT_DEVICE.Discovering}
          scanningMode={scanningMode}
          refreshSource
        />
      )}
      {state.devices.length > 0 ? (
        <Box lx={{ gap: "s16" }}>
          {state.devices.map(selectableDevice => (
            <DeviceCard
              key={selectableDevice.key}
              selectableDevice={withSelectionTracking(selectableDevice)}
            />
          ))}
        </Box>
      ) : null}
    </StateLayout>
  );
}
