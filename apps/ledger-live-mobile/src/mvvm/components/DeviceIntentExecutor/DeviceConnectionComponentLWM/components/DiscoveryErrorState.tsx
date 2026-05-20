import React from "react";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { InfoState } from "LLM/components/InfoState";
import { useTranslation } from "~/context/Locale";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.DiscoveryError }>;
};

type InfoStateCta = React.ComponentProps<typeof InfoState>["primaryCta"];

const discoveryErrorTranslationBaseKeys: Record<DiscoveryErrorTypes, string> = {
  [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedPromptable",
  [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionDeniedManualSettings",
  [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothPermissionUnauthorizedManualSettings",
  [DiscoveryErrorTypes.BluetoothDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledPromptable",
  [DiscoveryErrorTypes.BluetoothDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothDisabledManualAction",
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothStateUnknownCheckOnly",
  [DiscoveryErrorTypes.BluetoothUnsupported]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.bluetoothUnsupported",
  [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedPromptable",
  [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationPermissionDeniedManualSettings",
  [DiscoveryErrorTypes.LocationDisabledPromptable]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledPromptable",
  [DiscoveryErrorTypes.LocationDisabledManualAction]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationDisabledManualAction",
  [DiscoveryErrorTypes.LocationServicePermissionMissing]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.locationServicePermissionMissing",
  [DiscoveryErrorTypes.Unknown]:
    "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown",
};

const getDiscoveryErrorTranslationKey = (
  errorType: DiscoveryErrorTypes,
  key: "title" | "description",
) => `${discoveryErrorTranslationBaseKeys[errorType]}.${key}`;

export function DiscoveryErrorState({ state }: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const isUnknownError = state.error.type === DiscoveryErrorTypes.Unknown;

  const closeCta: InfoStateCta = {
    label: t("deviceIntentExecutor.connectDevice.common.close"),
    onPress: state.ignore,
  };

  const retryCta: InfoStateCta = state.retry
    ? {
        label: t("deviceIntentExecutor.connectDevice.common.tryAgain"),
        onPress: state.retry,
      }
    : undefined;

  const continueWithUsbCta: InfoStateCta = {
    label: t("deviceIntentExecutor.connectDevice.states.discoveryError.continueWithUsb"),
    onPress: state.ignore,
  };

  let primaryCta: InfoStateCta = retryCta;
  let secondaryCta: InfoStateCta = continueWithUsbCta;

  if (isUnknownError) {
    primaryCta = retryCta ?? closeCta;
    secondaryCta = retryCta ? closeCta : undefined;
  }

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t(getDiscoveryErrorTranslationKey(state.error.type, "title"))}
      description={t(getDiscoveryErrorTranslationKey(state.error.type, "description"))}
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
    />
  );
}
