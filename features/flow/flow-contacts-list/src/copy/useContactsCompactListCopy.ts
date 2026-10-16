import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export function useContactsCompactListCopy() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      emptyAddress: t("contacts.addressCount", { count: 0 }),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    }),
    [t],
  );
}
