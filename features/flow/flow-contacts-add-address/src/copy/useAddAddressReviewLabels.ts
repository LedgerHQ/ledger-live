import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { ContactsAddAddressReviewLabels } from "../screens/Review/types";

export function useAddAddressReviewLabels(): ContactsAddAddressReviewLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.addAddressReview.title"),
      addressLabel: t("contacts.addAddressReview.addressLabel"),
      currencyLabel: t("contacts.addAddressReview.currencyLabel"),
      networkLabel: t("contacts.addAddressReview.networkLabel"),
      nameLabel: t("contacts.addAddressReview.nameLabel"),
      continue: t("contacts.addAddressReview.continue"),
    }),
    [t],
  );
}
