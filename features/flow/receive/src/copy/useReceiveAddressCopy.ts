import { useTranslation } from "@shared/i18n";

export type ReceiveAddressCopy = Readonly<{
  title: string;
  networkLabel: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
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
  };
}
