import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { ContactsAddAddressNameLabels } from "../screens/AddressName/types";
import { useAddAddressNameValidationErrors } from "./useAddAddressNameValidationErrors";

export function useAddAddressNameLabels(): ContactsAddAddressNameLabels {
  const { t } = useTranslation();
  const validationErrors = useAddAddressNameValidationErrors();

  return useMemo(
    () => ({
      inputLabel: t("contacts.addAddressName.inputLabel"),
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      namingDisclaimerAccessibilityLabel: t(
        "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
      ),
      continueToReview: t("contacts.addAddressName.continueToReview"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      validationErrors,
    }),
    [t, validationErrors],
  );
}
