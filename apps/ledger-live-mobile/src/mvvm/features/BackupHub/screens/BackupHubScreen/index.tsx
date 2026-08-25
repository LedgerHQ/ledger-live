import React from "react";
import { BackupHubScreenView } from "./BackupHubScreenView";
import { useBackupHubScreenViewModel } from "./useBackupHubScreenViewModel";

export function BackupHubScreen() {
  const viewModel = useBackupHubScreenViewModel();
  return <BackupHubScreenView {...viewModel} />;
}
