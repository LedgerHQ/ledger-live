import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import type { ConnectNewDeviceNonErrorUIState } from "../types";

type ConnectingViewProps = {
  state: Extract<
    ConnectNewDeviceNonErrorUIState,
    { type: typeof ConnectNewDeviceUIStateTypes.Connecting }
  >;
};

// Placeholder: the final design comes with LIVE-38357.
export function ConnectingView({ state }: Readonly<ConnectingViewProps>): React.ReactNode {
  const { t } = useTranslation();
  const deviceName =
    state.device.name ?? t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  return (
    <Box lx={{ width: "full", alignItems: "center", gap: "s16", paddingVertical: "s32" }}>
      <Spinner size={32} color="base" />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("connectNewDevice.connecting.title", { deviceName })}
      </Text>
    </Box>
  );
}
