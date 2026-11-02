import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useOpenLink } from "@shared/linking";
import type { AccountSettingsMenuLabels } from "./types";

export function useAccountSettingsMenuViewModel(explorerUrl: string | undefined): Readonly<{
  labels: AccountSettingsMenuLabels;
  onViewExplorer?: () => void;
}> {
  const { t } = useTranslation();
  const openLink = useOpenLink();

  const onViewExplorer = useMemo(
    () => (explorerUrl ? () => openLink(explorerUrl, { sensitive: true }) : undefined),
    [explorerUrl, openLink],
  );

  return {
    labels: {
      changeName: t("accountDetailSettings.menu.changeName"),
      viewAdvancedLogs: t("accountDetailSettings.menu.viewAdvancedLogs"),
      viewExplorer: t("accountDetailSettings.menu.viewExplorer"),
      removeAccount: t("accountDetailSettings.menu.removeAccount"),
    },
    onViewExplorer,
  };
}
