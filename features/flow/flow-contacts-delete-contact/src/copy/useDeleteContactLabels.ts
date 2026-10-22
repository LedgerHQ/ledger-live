import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useDeleteContactDescription } from "./useDeleteContactDescription";

export type DeleteContactLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export function useDeleteContactLabels(): DeleteContactLabels {
  const { t } = useTranslation();
  const description = useDeleteContactDescription();

  return useMemo(
    () => ({
      title: t("contacts.deleteContact.title"),
      description,
      confirm: t("contacts.deleteContact.confirm"),
      cancel: t("contacts.deleteContact.cancel"),
    }),
    [description, t],
  );
}
