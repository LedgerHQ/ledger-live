import React from "react";
import { useTranslation } from "react-i18next";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { getErrorName } from "@ledgerhq/live-dmk-shared";

import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type UnknownErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.UnknownError }>;
};

export function UnknownErrorState({ state }: Readonly<UnknownErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.UnknownError}
        subError={getErrorName(state.error)}
        refreshSource
      />
      <InfoState
        preset="error"
        size="hug"
        title={t("deviceIntentExecutor.errors.intentError.title")}
        description={t("deviceIntentExecutor.errors.intentError.description")}
        testID="device-intent-executor-connect-device-unknown-error"
      />
    </>
  );
}
