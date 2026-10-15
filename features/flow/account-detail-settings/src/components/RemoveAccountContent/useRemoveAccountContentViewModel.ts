import { useTranslation } from "@shared/i18n";
import type { RemoveAccountContentLabels } from "./types";

export function useRemoveAccountContentViewModel(): Readonly<{
  labels: RemoveAccountContentLabels;
}> {
  const { t } = useTranslation();

  return {
    labels: {
      title: t("accountDetailSettings.remove.title"),
      description: t("accountDetailSettings.remove.description"),
      confirm: t("accountDetailSettings.remove.confirm"),
      cancel: t("accountDetailSettings.remove.cancel"),
    },
  };
}
