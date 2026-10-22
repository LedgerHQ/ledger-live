import { useMemo } from "react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type ContactAddressLabelValidationErrorName,
} from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

export function useAddAddressNameValidationErrors(): Record<
  ContactAddressLabelValidationErrorName,
  string
> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
      [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
      [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
    }),
    [t],
  );
}
