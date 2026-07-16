import { useTranslation } from "~/context/Locale";

export function useFooterSectionViewModel() {
  const { t } = useTranslation();
  return {
    viewInExplorerLabel: t("transfer.swap2.modals.transactionStatus.actions.viewInExplorer"),
  };
}
