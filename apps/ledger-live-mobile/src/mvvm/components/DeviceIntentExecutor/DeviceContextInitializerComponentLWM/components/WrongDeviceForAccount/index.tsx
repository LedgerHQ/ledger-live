import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { WrongDeviceForAccountView } from "./WrongDeviceForAccountView";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";

type WrongDeviceForAccountProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.WrongDeviceForAccount }>
>;

export function WrongDeviceForAccount({
  device,
  sourceFlow,
  onCancel,
}: WrongDeviceForAccountProps) {
  const viewModel = useWrongDeviceForAccountViewModel({
    device,
    sourceFlow,
    onCancel,
  });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.WrongDeviceForAccount}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <WrongDeviceForAccountView {...viewModel} />
    </>
  );
}
