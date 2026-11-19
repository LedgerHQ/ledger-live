import React from "react";
import type { SetupInfoProps } from "./SetupInfo.types";
import { SetupInfoView } from "./SetupInfoView";
import { useSetupInfoViewModel } from "./useSetupInfoViewModel";

export function SetupInfo(props: SetupInfoProps) {
  return <SetupInfoView {...useSetupInfoViewModel(props)} />;
}
