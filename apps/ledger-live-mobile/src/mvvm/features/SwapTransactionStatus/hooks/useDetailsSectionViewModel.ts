import { getSwapTransactionStatusDetailsViewModel } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import { useTranslation } from "~/context/Locale";

type UseDetailsSectionViewModelProps = Readonly<{
  provider?: string;
  providerData?: AdditionalProviderConfig;
  swapId: string;
}>;

export function useDetailsSectionViewModel({
  provider,
  providerData,
  swapId,
}: UseDetailsSectionViewModelProps) {
  const { t } = useTranslation();
  const { providerName, providerMainUrl, truncatedSwapId } =
    getSwapTransactionStatusDetailsViewModel({ provider, providerData, swapId });

  return {
    networkFeesLabel: t("transfer.swap2.modals.transactionStatus.sections.details.networkFees"),
    receiveAccountLabel: t(
      "transfer.swap2.modals.transactionStatus.sections.details.receiveAccount",
    ),
    providerLabel: t("transfer.swap2.modals.transactionStatus.sections.details.provider"),
    swapIdLabel: t("transfer.swap2.modals.transactionStatus.sections.details.swapId"),
    providerName,
    providerMainUrl,
    truncatedSwapId,
  };
}
