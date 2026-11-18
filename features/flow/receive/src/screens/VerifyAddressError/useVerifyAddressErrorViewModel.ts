import { useTranslation } from "@shared/i18n";
import type { VerifyAddressErrorProps } from "./VerifyAddressError.types";

export function useVerifyAddressErrorViewModel(props: VerifyAddressErrorProps) {
  const { t } = useTranslation();
  return { ...props, closeLabel: t("receiveAddress.close") };
}
