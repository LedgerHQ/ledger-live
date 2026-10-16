export type AccountSettingsDialogStep = "menu" | "remove";

export type AccountSettingsDialogProps = Readonly<{
  isOpen: boolean;
  accountName: string;
  onClose: () => void;
  onChangeName: () => void;
  onViewAdvancedLogs: () => void;
  onConfirmRemove: () => void;
  testID?: string;
}>;

export type AccountSettingsDialogViewProps = AccountSettingsDialogProps &
  Readonly<{
    step: AccountSettingsDialogStep;
    title: string;
    onShowMenu: () => void;
    onShowRemove: () => void;
  }>;
