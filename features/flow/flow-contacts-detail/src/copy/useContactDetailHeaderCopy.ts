import type { Contact } from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useContactDetailHeaderCopy(
  contact: Contact,
): Readonly<{ addAddress: string; addressCount: string }> {
  const { t } = useTranslation();

  return {
    addAddress: contact.isMe ? t("contacts.addYourAddress") : t("contacts.addAddress"),
    addressCount: t("contacts.addressCount", { count: contact.addresses.length }),
  };
}
