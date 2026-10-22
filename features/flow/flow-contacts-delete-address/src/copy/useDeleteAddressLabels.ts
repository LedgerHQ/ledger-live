import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export type DeleteAddressLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export function useDeleteAddressLabels(): DeleteAddressLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.deleteAddress.title"),
      description: t("contacts.deleteAddress.description"),
      confirm: t("contacts.deleteAddress.confirm"),
      cancel: t("contacts.deleteAddress.cancel"),
    }),
    [t],
  );
}
