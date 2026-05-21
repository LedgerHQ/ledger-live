import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { WrongDeviceForAccountView } from "./WrongDeviceForAccountView";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";

type WrongDeviceForAccountProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.WrongDeviceForAccount }>
>;

export function WrongDeviceForAccount({ device, onCancel }: WrongDeviceForAccountProps) {
  const viewModel = useWrongDeviceForAccountViewModel({ device, onCancel });
  return <WrongDeviceForAccountView {...viewModel} />;
}
