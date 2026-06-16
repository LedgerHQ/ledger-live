import React from "react";
import { BackupHubView } from "./BackupHubView";
import { useBackupHubViewModel, type BackupHubParams } from "./useBackupHubViewModel";

function BackupHub(params: Readonly<BackupHubParams>) {
  const props = useBackupHubViewModel(params);

  return <BackupHubView {...props} />;
}

export default BackupHub;
