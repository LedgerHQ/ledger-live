import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

type ConnectingStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Connecting }>;
};

export function ConnectingState(_props: Readonly<ConnectingStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return <LoadingContent title={t("deviceIntentExecutor.connectDevice.states.connecting.title")} />;
}
