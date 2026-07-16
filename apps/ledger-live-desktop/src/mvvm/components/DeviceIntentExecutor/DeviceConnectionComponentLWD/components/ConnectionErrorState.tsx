import React from "react";
import {
  BaseConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { InfoState } from "LLD/components/InfoState";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.ConnectionError }>;
};

export function ConnectionErrorState({
  state,
}: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  if (state.error.type !== BaseConnectionErrorTypes.Unknown) {
    return null;
  }

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.title")}
      description={t(
        "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.description",
      )}
      banner={{
        title: t("deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.tip"),
      }}
      primaryCta={{
        label: t(
          "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.cta.retry",
        ),
        onPress: state.retry,
      }}
      testID="device-intent-executor-connect-device-connection-error"
    />
  );
}
