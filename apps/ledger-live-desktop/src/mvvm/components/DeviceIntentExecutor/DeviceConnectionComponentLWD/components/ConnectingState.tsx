import React from "react";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  webHidTransportIdentifier,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type ConnectingStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Connecting }>;
};

export function ConnectingState({ state }: Readonly<ConnectingStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const transport = state.device.transport === webHidTransportIdentifier ? "usb" : "ble";

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.Connecting}
        modelId={state.device.deviceModelId}
        transport={transport}
        refreshSource
      />
      <LoadingContent title={t("deviceIntentExecutor.connectDevice.states.connecting.title")} />
    </>
  );
}
