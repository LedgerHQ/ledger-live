import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

type UnsupportedFirmwareVersionProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFirmwareVersion }>
>;

export function UnsupportedFirmwareVersion({ onCancel }: UnsupportedFirmwareVersionProps) {
  const viewModel = useUnsupportedFirmwareVersionViewModel({ onCancel });

  return <UnsupportedFirmwareVersionView {...viewModel} />;
}
