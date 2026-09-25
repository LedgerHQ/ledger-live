import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { getErrorSubError } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "~/context/Locale";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type UnknownErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.UnknownError }>;
};

/**
 * Rendered when the connect device use case escalates an unexpected error
 * (i.e. anything that escaped the inner state machine and was funneled into
 * the terminal `UnknownError` UI state). Wording is shared with the
 * executor's `IntentError` fallback because both represent the same
 * "this shouldn't have happened" category. No retry: the host chrome
 * provides the dismiss affordance.
 */
export function UnknownErrorState({ state }: Readonly<UnknownErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.UnknownError}
        subError={getErrorSubError(state.error)}
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
