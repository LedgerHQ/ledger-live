export type ManageBackupStepProps = {
  goToDeleteBackup: () => void;
};

export type DeleteBackupStepProps = {
  cancel: () => void;
};

export type BackupDeletedProps = {
  isSuccessful: boolean;
};
