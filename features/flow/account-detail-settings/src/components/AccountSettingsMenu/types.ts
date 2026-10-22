export type AccountSettingsMenuProps = Readonly<{
  accountName: string;
  onChangeName: () => void;
  onViewAdvancedLogs: () => void;
  onRemoveAccount: () => void;
}>;

export type AccountSettingsMenuLabels = Readonly<{
  changeName: string;
  viewAdvancedLogs: string;
  removeAccount: string;
}>;

export type AccountSettingsMenuViewProps = AccountSettingsMenuProps &
  Readonly<{ labels: AccountSettingsMenuLabels }>;
