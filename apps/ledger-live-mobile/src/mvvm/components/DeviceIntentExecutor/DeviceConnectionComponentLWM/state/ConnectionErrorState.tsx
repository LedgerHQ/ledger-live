import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.ConnectionError }>;
};

const connectionErrorTitleKeys: Record<ConnectionErrorTypes, string> = {
  [ConnectionErrorTypes.BlePairingRefused]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.blePairingRefused.title",
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.blePairingPeerRemovedPairing.title",
  [ConnectionErrorTypes.Unknown]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.title",
};

const connectionErrorDescriptionKeys: Record<ConnectionErrorTypes, string> = {
  [ConnectionErrorTypes.BlePairingRefused]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.blePairingRefused.description",
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.blePairingPeerRemovedPairing.description",
  [ConnectionErrorTypes.Unknown]:
    "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.description",
};

export function ConnectionErrorState({ state }: ConnectionErrorStateProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", alignItems: "center", gap: "s32" }}>
      <Box lx={{ width: "full", alignItems: "center", gap: "s24" }}>
        <Spot appearance="error" size={72} />
        <Box lx={{ width: "full", alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {t(connectionErrorTitleKeys[state.error.type])}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {t(connectionErrorDescriptionKeys[state.error.type])}
          </Text>
        </Box>
      </Box>
      <Box lx={{ width: "full", gap: "s16" }}>
        <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={state.retry}>
          {t("deviceIntentExecutor.connectDevice.common.tryAgain")}
        </Button>
        <Button appearance="gray" size="lg" lx={{ width: "full" }} onPress={state.ignore}>
          {t("deviceIntentExecutor.connectDevice.common.close")}
        </Button>
      </Box>
    </Box>
  );
}
