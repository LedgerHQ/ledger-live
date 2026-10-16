import { useTranslation } from "@shared/i18n";

export function useAddressLabelTooLong() {
  const { t } = useTranslation();

  // Temporary until contact detail migrates to tooLongLabel (LIVE-39329).
  return t("contacts.addAddressName.labelTooLong");
}
