import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

type UnsupportedFirmwareVersionProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFirmwareVersion }>
>;

export function UnsupportedFirmwareVersion({ device, onCancel }: UnsupportedFirmwareVersionProps) {
  const viewModel = useUnsupportedFirmwareVersionViewModel({ device, onCancel });
  return <UnsupportedFirmwareVersionView {...viewModel} />;
}
