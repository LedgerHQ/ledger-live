import { useFormatDaySection } from "~/hooks/useDateFormatter";
import { useTranslation } from "~/context/Locale";

export function useOperationsSectionHeaderViewModel(day: Date, isPending?: boolean) {
  const { t } = useTranslation();
  const formatDay = useFormatDaySection();

  return {
    formattedDay: isPending ? t("operationsList.pending") : formatDay(day),
  };
}
