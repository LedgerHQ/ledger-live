export type AccountSettingsDialogStep = "menu" | "changeName" | "remove";

export type AccountSettingsDialogProps = Readonly<{
  isOpen: boolean;
  accountName: string;
  ticker: string;
  nameMaxLength: number;
  isNameEditDisabled?: boolean;
  onClose: () => void;
  onConfirmName: (name: string) => void;
  onViewAdvancedLogs: () => void;
  onConfirmRemove: () => void;
  testID?: string;
}>;

export type AccountSettingsDialogViewProps = AccountSettingsDialogProps &
  Readonly<{
    step: AccountSettingsDialogStep;
    title: string;
    changeNameTitle: string;
    changeNameDescription: string;
    onShowMenu: () => void;
    onShowChangeName: () => void;
    onShowRemove: () => void;
  }>;
