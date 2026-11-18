import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { UserRefusedOnDevice } from "../../../components/DeviceGenericStates/UserRefusedOnDevice";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { useUserRefusedOnDeviceStateViewModel } from "./useUserRefusedOnDeviceStateViewModel";

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({
  state,
  device,
  onCancel,
}: UserRefusedOnDeviceStateProps) {
  const { onClose, onRetry } = useUserRefusedOnDeviceStateViewModel({
    device,
    onCancel,
    retry: state.retry,
  });

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.UserRefused}
        modelId={device.modelId}
        refreshSource
      />
      <UserRefusedOnDevice
        onClose={onClose}
        onRetry={onRetry}
        testID="device-initializer-user-refused-on-device"
      />
    </>
  );
}
