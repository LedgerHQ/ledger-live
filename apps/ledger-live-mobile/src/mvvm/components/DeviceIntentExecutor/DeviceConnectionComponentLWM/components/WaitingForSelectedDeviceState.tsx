import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { useSourceFlow } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type WaitingForSelectedDeviceStateProps = {
  state: Extract<
    ConnectDeviceUIState,
    { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
  >;
};

function getDeviceName(
  device: WaitingForSelectedDeviceStateProps["state"]["device"],
  fallbackName: string,
): string {
  return device.name ?? fallbackName;
}

export function WaitingForSelectedDeviceState({
  state,
}: Readonly<WaitingForSelectedDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const sourceFlow = useSourceFlow();
  const productName = getDeviceModel(state.device.deviceModelId).productName;

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_DEVICE.WaitingForSelectedDevice}
        sourceFlow={sourceFlow}
        modelId={state.device.deviceModelId}
        refreshSource
        deviceUxV2
      />
      <DeviceActionContent
        action="power-and-unlock"
        deviceModelId={state.device.deviceModelId}
        deviceName={getDeviceName(
          state.device,
          t("deviceIntentExecutor.connectDevice.common.ledgerDevice"),
        )}
        title={t("deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title", {
          productName,
        })}
      />
    </>
  );
}
