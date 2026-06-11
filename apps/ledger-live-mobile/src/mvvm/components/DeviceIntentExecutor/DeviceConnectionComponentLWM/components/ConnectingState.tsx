import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  rnHidTransportIdentifier,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { useSourceFlow } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type ConnectingStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Connecting }>;
};

export function ConnectingState({ state }: Readonly<ConnectingStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const sourceFlow = useSourceFlow();
  const modelId = state.device.deviceModelId;
  const transport: "ble" | "usb" =
    state.device.transport === rnHidTransportIdentifier ? "usb" : "ble";

  return (
    <Box lx={{ width: "full", alignItems: "center", paddingTop: "s32", paddingBottom: "s32" }}>
      <TrackScreen
        category={PAGE_CONNECT_DEVICE.Connecting}
        sourceFlow={sourceFlow}
        modelId={modelId}
        transport={transport}
        refreshSource
        deviceUxV2
      />
      <Box lx={{ width: "full", alignItems: "center", gap: "s16" }}>
        <Spinner size={32} color="base" />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("deviceIntentExecutor.connectDevice.states.connecting.title")}
        </Text>
      </Box>
    </Box>
  );
}
