import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.DiscoveryError }>;
};

const discoveryErrorTitleKeys: Record<DiscoveryErrorTypes, string> = {
  [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedPromptable.title",
  [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedManualSettings.title",
  [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionUnauthorizedManualSettings.title",
  [DiscoveryErrorTypes.BluetoothDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledPromptable.title",
  [DiscoveryErrorTypes.BluetoothDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledManualAction.title",
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothStateUnknownCheckOnly.title",
  [DiscoveryErrorTypes.BluetoothUnsupported]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothUnsupported.title",
  [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedPromptable.title",
  [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedManualSettings.title",
  [DiscoveryErrorTypes.LocationDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledPromptable.title",
  [DiscoveryErrorTypes.LocationDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledManualAction.title",
  [DiscoveryErrorTypes.LocationServicePermissionMissing]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationServicePermissionMissing.title",
  [DiscoveryErrorTypes.Unknown]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.title",
};

const discoveryErrorDescriptionKeys: Record<DiscoveryErrorTypes, string> = {
  [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedPromptable.description",
  [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedManualSettings.description",
  [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionUnauthorizedManualSettings.description",
  [DiscoveryErrorTypes.BluetoothDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledPromptable.description",
  [DiscoveryErrorTypes.BluetoothDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledManualAction.description",
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothStateUnknownCheckOnly.description",
  [DiscoveryErrorTypes.BluetoothUnsupported]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothUnsupported.description",
  [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedPromptable.description",
  [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedManualSettings.description",
  [DiscoveryErrorTypes.LocationDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledPromptable.description",
  [DiscoveryErrorTypes.LocationDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledManualAction.description",
  [DiscoveryErrorTypes.LocationServicePermissionMissing]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationServicePermissionMissing.description",
  [DiscoveryErrorTypes.Unknown]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.description",
};

export function DiscoveryErrorState({ state }: DiscoveryErrorStateProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", alignItems: "center", gap: "s32" }}>
      <Box lx={{ width: "full", alignItems: "center", gap: "s24" }}>
        <Spot appearance="info" size={72} />
        <Box lx={{ width: "full", alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {t(discoveryErrorTitleKeys[state.error.type])}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {t(discoveryErrorDescriptionKeys[state.error.type])}
          </Text>
        </Box>
      </Box>
      <Box lx={{ width: "full", gap: "s16" }}>
        {state.retry && (
          <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={state.retry}>
            {t("deviceIntentExecutor.connectDevice.common.tryAgain")}
          </Button>
        )}
        {state.error.type !== DiscoveryErrorTypes.Unknown ? (
          <Button appearance="gray" size="lg" lx={{ width: "full" }} onPress={state.ignore}>
            {t("deviceIntentExecutor.connectDevice.states.discoveryError.continueWithUsb")}
          </Button>
        ) : (
          <Button appearance="gray" size="lg" lx={{ width: "full" }} onPress={state.ignore}>
            {t("deviceIntentExecutor.connectDevice.common.close")}
          </Button>
        )}
      </Box>
    </Box>
  );
}
