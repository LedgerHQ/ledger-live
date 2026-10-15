import { useTranslation } from "@shared/i18n";

export function useAddressNameTooLongLabel(): string {
  const { t } = useTranslation();
  return t("contacts.addAddressName.tooLongLabel");
}
