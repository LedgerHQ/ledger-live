import React from "react";
import { getErrorName, type UnknownErrorUIState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { UnknownErrorState } from "./UnknownErrorState";

type TrackedUnknownErrorStateProps = {
  state: UnknownErrorUIState;
};

/** `UnknownErrorState` with its Connect Device page event. */
export function TrackedUnknownErrorState({
  state,
}: Readonly<TrackedUnknownErrorStateProps>): React.ReactNode {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.UnknownError}
        subError={getErrorName(state.error)}
        refreshSource
      />
      <UnknownErrorState />
    </>
  );
}
