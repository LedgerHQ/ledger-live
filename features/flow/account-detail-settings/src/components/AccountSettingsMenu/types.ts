export type AccountSettingsMenuProps = Readonly<{
  accountName: string;
  explorerUrl?: string;
  onChangeName: () => void;
  onViewAdvancedLogs: () => void;
  onRemoveAccount: () => void;
}>;

export type AccountSettingsMenuLabels = Readonly<{
  changeName: string;
  viewAdvancedLogs: string;
  viewExplorer: string;
  removeAccount: string;
}>;

export type AccountSettingsMenuViewProps = Omit<AccountSettingsMenuProps, "explorerUrl"> &
  Readonly<{ labels: AccountSettingsMenuLabels; onViewExplorer?: () => void }>;
