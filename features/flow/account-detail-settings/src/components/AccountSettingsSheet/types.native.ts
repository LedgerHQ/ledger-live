import type { AccountSettingsEventHandler } from "../../logic/accountSettingsEvent";
import type { AccountExplorerSource } from "../../logic/getAccountExplorerUrl";

export type AccountSettingsSheetStep = "menu" | "remove";

export type AccountSettingsSheetProps = Readonly<{
  isOpen: boolean;
  accountName: string;
  onClose: () => void;
  onChangeName: () => void;
  onManageAssets?: () => void;
  onViewAdvancedLogs: () => void;
  account: AccountExplorerSource;
  onConfirmRemove: () => void;
  onHidden?: () => void;
  onEvent?: AccountSettingsEventHandler;
  testID?: string;
}>;

export type AccountSettingsSheetViewProps = AccountSettingsSheetProps &
  Readonly<{
    step: AccountSettingsSheetStep;
    title: string;
    explorerUrl?: string;
    onShowMenu: () => void;
    onShowRemove: () => void;
  }>;
