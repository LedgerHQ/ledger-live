import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export function useEditSignerMismatchCopy() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.editSignerMismatch.title"),
      description: t("contacts.editSignerMismatch.description"),
      connectDifferentDevice: t("contacts.editSignerMismatch.connectDifferentDevice"),
      cancel: t("contacts.editSignerMismatch.cancel"),
    }),
    [t],
  );
}
