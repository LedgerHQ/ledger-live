import { useTranslation } from "@shared/i18n";
import type { AccountSettingsMenuLabels } from "./types";

export function useAccountSettingsMenuViewModel(): Readonly<{ labels: AccountSettingsMenuLabels }> {
  const { t } = useTranslation();

  return {
    labels: {
      changeName: t("accountDetailSettings.menu.changeName"),
      viewAdvancedLogs: t("accountDetailSettings.menu.viewAdvancedLogs"),
      removeAccount: t("accountDetailSettings.menu.removeAccount"),
    },
  };
}
