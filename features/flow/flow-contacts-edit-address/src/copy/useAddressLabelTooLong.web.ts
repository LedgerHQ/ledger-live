import { useTranslation } from "@shared/i18n";

export function useAddressLabelTooLong() {
  const { t } = useTranslation();

  return t("contacts.addAddressName.tooLongLabel");
}
