import { useTranslation } from "@shared/i18n";
import { useMemo } from "react";
import {
  createMeDisplayNameFormatter,
  type FormatMeDisplayName,
} from "../utils/formatMeDisplayName";

export function useMeDisplayNameFormatter(): FormatMeDisplayName {
  const { t } = useTranslation();

  return useMemo(
    () =>
      createMeDisplayNameFormatter(t("contacts.me.myAddresses"), name =>
        t("contacts.detail.meDisplayName", { name }),
      ),
    [t],
  );
}
