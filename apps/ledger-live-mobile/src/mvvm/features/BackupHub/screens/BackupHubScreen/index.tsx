import React from "react";
import { BackupHubScreenView } from "./BackupHubScreenView";
import { useBackupHubScreenViewModel } from "./useBackupHubScreenViewModel";
import { RecoverIntroDrawer } from "../../components/RecoverIntroDrawer";

export function BackupHubScreen() {
  const viewModel = useBackupHubScreenViewModel();
  return (
    <>
      <BackupHubScreenView {...viewModel} />
      <RecoverIntroDrawer />
    </>
  );
}
