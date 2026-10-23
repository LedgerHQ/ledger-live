import type { AdvancedLogsContentProps } from "../AdvancedLogsContent/types";

export type AccountSettingsDialogStep = "menu" | "changeName" | "advancedLogs" | "remove";

export type AccountSettingsDialogProps = Readonly<{
  isOpen: boolean;
  accountName: string;
  ticker: string;
  nameMaxLength: number;
  isNameEditDisabled?: boolean;
  advancedLogs: AdvancedLogsContentProps;
  onClose: () => void;
  onConfirmName: (name: string) => void;
  onConfirmRemove: () => void;
  explorerUrl?: string;
  testID?: string;
}>;

export type AccountSettingsDialogViewProps = AccountSettingsDialogProps &
  Readonly<{
    step: AccountSettingsDialogStep;
    title: string;
    changeNameTitle: string;
    changeNameDescription: string;
    advancedLogsTitle: string;
    onShowMenu: () => void;
    onShowChangeName: () => void;
    onShowAdvancedLogs: () => void;
    onShowRemove: () => void;
  }>;
