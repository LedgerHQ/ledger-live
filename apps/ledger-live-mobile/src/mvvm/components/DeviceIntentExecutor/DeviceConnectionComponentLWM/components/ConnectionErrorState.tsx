import React from "react";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { InfoState } from "LLM/components/InfoState";
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

export function ConnectionErrorState({ state }: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t(connectionErrorTitleKeys[state.error.type])}
      description={t(connectionErrorDescriptionKeys[state.error.type])}
      primaryCta={{
        label: t("deviceIntentExecutor.connectDevice.common.tryAgain"),
        onPress: state.retry,
      }}
      secondaryCta={{
        label: t("deviceIntentExecutor.connectDevice.common.close"),
        onPress: state.ignore,
      }}
    />
  );
}
