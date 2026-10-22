import { useTranslation } from "@shared/i18n";

export function useDeleteContactDescription(): string {
  const { t } = useTranslation();
  return t("contacts.deleteContact.mobileDescription");
}
