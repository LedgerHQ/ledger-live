import { useCallback, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useOpenLink } from "@shared/linking";
import type { AccountSettingsMenuLabels, AccountSettingsMenuProps } from "./types";

type Props = Omit<AccountSettingsMenuProps, "accountName">;

export function useAccountSettingsMenuViewModel({
  explorerUrl,
  onEvent,
  onChangeName,
  onManageAssets,
  onViewAdvancedLogs,
  onRemoveAccount,
}: Props): Readonly<{
  labels: AccountSettingsMenuLabels;
  onChangeName: () => void;
  onManageAssets?: () => void;
  onViewAdvancedLogs: () => void;
  onRemoveAccount: () => void;
  onViewExplorer?: () => void;
}> {
  const { t } = useTranslation();
  const openLink = useOpenLink();

  const handleChangeName = useCallback(() => {
    onEvent?.("changeName");
    onChangeName();
  }, [onChangeName, onEvent]);

  const handleViewAdvancedLogs = useCallback(() => {
    onEvent?.("viewLogs");
    onViewAdvancedLogs();
  }, [onEvent, onViewAdvancedLogs]);

  const handleRemoveAccount = useCallback(() => {
    onEvent?.("removeFromPortfolio");
    onRemoveAccount();
  }, [onEvent, onRemoveAccount]);

  const onViewExplorer = useMemo(
    () =>
      explorerUrl
        ? () => {
            onEvent?.("viewExplorer");
            openLink(explorerUrl, { sensitive: true });
          }
        : undefined,
    [explorerUrl, onEvent, openLink],
  );

  return {
    labels: {
      changeName: t("accountDetailSettings.menu.changeName"),
      manageAssets: t("accountDetailSettings.menu.manageAssets"),
      viewAdvancedLogs: t("accountDetailSettings.menu.viewAdvancedLogs"),
      viewExplorer: t("accountDetailSettings.menu.viewExplorer"),
      removeAccount: t("accountDetailSettings.menu.removeAccount"),
    },
    onChangeName: handleChangeName,
    onManageAssets,
    onViewAdvancedLogs: handleViewAdvancedLogs,
    onRemoveAccount: handleRemoveAccount,
    onViewExplorer,
  };
}
