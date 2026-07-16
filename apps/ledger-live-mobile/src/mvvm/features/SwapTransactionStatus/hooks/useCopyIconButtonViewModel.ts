import { useTranslation } from "~/context/Locale";

export function useCopyIconButtonViewModel() {
  const { t } = useTranslation();
  return {
    copyLabel: t("transfer.swap2.modals.transactionStatus.accessibility.copySwapId"),
    copiedText: t("transfer.swap2.modals.transactionStatus.actions.copied"),
  };
}
