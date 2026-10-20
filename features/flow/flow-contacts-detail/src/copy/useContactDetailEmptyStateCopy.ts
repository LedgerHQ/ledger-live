import type { Contact } from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useContactDetailEmptyStateCopy(
  contact: Contact,
): Readonly<{ title: string; description: string }> {
  const { t } = useTranslation();

  if (contact.isMe) {
    return {
      title: t("contacts.detail.emptyState.meTitle"),
      description: t("contacts.detail.emptyState.meDescription"),
    };
  }

  return {
    title: t("contacts.detail.emptyState.contactTitle", { name: contact.name }),
    description: t("contacts.detail.emptyState.contactDescription"),
  };
}
