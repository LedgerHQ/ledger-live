import { useTranslation } from "@shared/i18n";
import type { AddressDisplayedViewProps } from "./AddressDisplayedView.types";

export function useAddressDisplayedViewModel(): AddressDisplayedViewProps {
  const { t } = useTranslation();

  return {
    title: t("receiveAddress.addressDisplayed.title"),
    description: t("receiveAddress.addressDisplayed.description"),
  };
}
