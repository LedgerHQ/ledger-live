import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState, StateLayoutComponent } from "../types";
import { getScanningMode, type ScanningMode } from "../utils/getScanningMode";
import { DeviceCard } from "./DeviceCard";

type DiscoveringViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Discovering }
  >;
  onDeviceNotFound?: () => void;
  Layout: StateLayoutComponent;
};

const descriptionKeys = {
  bluetooth: "connectNewDevice.discovering.description.bluetooth",
  bluetoothAndUsb: "connectNewDevice.discovering.description.bluetoothAndUsb",
  usb: "connectNewDevice.discovering.description.usb",
} as const satisfies Record<ScanningMode, string>;

export function DiscoveringView({
  state,
  onDeviceNotFound,
  Layout,
}: Readonly<DiscoveringViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const scanningMode = getScanningMode(state.scanningTransports);

  return (
    <Layout
      animation={scanningMode}
      loopAnimation
      title={t("connectNewDevice.discovering.title")}
      description={t(descriptionKeys[scanningMode])}
      footer={
        state.showDeviceNotFound && onDeviceNotFound ? (
          <Button appearance="no-background" size="lg" isFull onPress={onDeviceNotFound}>
            {t("connectNewDevice.discovering.deviceNotFound")}
          </Button>
        ) : null
      }
      testID={`connect-new-device-discovering-${scanningMode}`}
    >
      {state.devices.length > 0 ? (
        <Box lx={{ gap: "s16" }}>
          {state.devices.map(selectableDevice => (
            <DeviceCard key={selectableDevice.key} selectableDevice={selectableDevice} />
          ))}
        </Box>
      ) : null}
    </Layout>
  );
}
