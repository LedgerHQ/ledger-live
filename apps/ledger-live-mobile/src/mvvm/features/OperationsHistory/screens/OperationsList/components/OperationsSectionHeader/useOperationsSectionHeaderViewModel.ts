import { useFormatDaySection } from "~/hooks/useDateFormatter";

export function useOperationsSectionHeaderViewModel(day: Date) {
  const formatDay = useFormatDaySection();

  return {
    formattedDay: formatDay(day),
  };
}
