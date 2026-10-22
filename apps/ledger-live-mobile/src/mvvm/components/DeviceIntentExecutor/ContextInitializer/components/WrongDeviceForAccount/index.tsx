import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { WrongDeviceForAccountView } from "./WrongDeviceForAccountView";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";

type WrongDeviceForAccountProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.WrongDeviceForAccount }>
>;

export function WrongDeviceForAccount({ device, onCancel }: WrongDeviceForAccountProps) {
  const viewModel = useWrongDeviceForAccountViewModel({
    device,
    onCancel,
  });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.WrongDeviceForAccount}
        modelId={device.modelId}
        refreshSource
      />
      <WrongDeviceForAccountView {...viewModel} />
    </>
  );
}
