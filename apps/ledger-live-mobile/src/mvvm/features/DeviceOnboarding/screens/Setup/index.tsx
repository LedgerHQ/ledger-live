import React from "react";
import type { SetupScreenProps } from "./types";
import { SetupView } from "./SetupView";
import { useSetupScreenViewModel } from "./useSetupScreenViewModel";

export function SetupScreen(props: Readonly<SetupScreenProps>) {
  return <SetupView {...useSetupScreenViewModel(props)} />;
}
