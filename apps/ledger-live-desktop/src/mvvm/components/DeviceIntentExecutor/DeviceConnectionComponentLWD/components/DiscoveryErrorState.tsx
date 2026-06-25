import React from "react";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { InfoState } from "LLD/components/InfoState";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.DiscoveryError }>;
};

export function DiscoveryErrorState({
  state,
}: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  if (state.error.type !== BaseDiscoveryErrorTypes.Unknown) {
    return null;
  }

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.title")}
      description={t(
        "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.description",
      )}
      primaryCta={
        state.retry
          ? {
              label: t(
                "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.cta.retry",
              ),
              onPress: state.retry,
            }
          : undefined
      }
      testID="device-intent-executor-connect-device-discovery-error"
    />
  );
}
