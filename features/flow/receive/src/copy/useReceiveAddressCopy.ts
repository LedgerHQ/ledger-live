import { useTranslation } from "@shared/i18n";
import type { ReceiveAddressOptionId } from "../logic/toReceiveAddressOptions";

export type ReceiveAddressCopy = Readonly<{
  title: string;
  networkLabel: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
  selectAddressTitle: string;
  addressOptionLabels: Readonly<Record<ReceiveAddressOptionId, string>>;
}>;

/** The labels of the address screen, under the `receiveAddress` namespace. */
export function useReceiveAddressCopy({
  assetTicker,
  networkName,
}: Readonly<{ assetTicker: string; networkName: string }>): ReceiveAddressCopy {
  const { t } = useTranslation();

  return {
    title: t("receiveAddress.title", { asset: assetTicker }),
    networkLabel: t("receiveAddress.networkLabel", { network: networkName }),
    errorTitle: t("receiveAddress.error.title"),
    errorDescription: t("receiveAddress.error.description"),
    retryLabel: t("receiveAddress.error.retry"),
    selectAddressTitle: t("receiveAddress.selectAddress.title"),
    addressOptionLabels: {
      transparent: t("receiveAddress.addressOptions.transparent"),
      shielded: t("receiveAddress.addressOptions.shielded"),
    },
  };
}
